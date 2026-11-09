import { describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import {
  FEATURED_COMPETITION_IDS,
  TOP_TIER_COMPETITION_IDS,
  isMatchIndexable,
  isPlayerIndexable,
  matchIndexableSitemapCondition,
  playerIndexableSitemapCondition,
} from '@/lib/seo/indexable';

const dialect = new PgDialect();
const render = (q: SQL) => dialect.sqlToQuery(q).sql.replace(/\s+/g, ' ');

function fakeDb(indexable: boolean) {
  const execute = vi.fn(async (_q: SQL) => ({ rows: [{ indexable }] }));
  return { db: { execute } as never, execute };
}

describe('match index policy SQL', () => {
  const q = render(matchIndexableSitemapCondition);

  it('keeps featured competitions at any age', () => {
    expect(FEATURED_COMPETITION_IDS).toEqual([1, 6, 922, 200, 201, 822]);
    expect(q).toMatch(/^\( "fixtures"\."competition_id" IN \(1, 6, 922, 200, 201, 822\) OR \(/);
  });

  it('limits top-tier comps to 180 days past / 14 days ahead', () => {
    expect(TOP_TIER_COMPETITION_IDS).toEqual([2, 3, 848, 39, 140, 78, 135, 61]);
    expect(q).toContain('"fixtures"."competition_id" IN (2, 3, 848, 39, 140, 78, 135, 61)');
    expect(q).toContain(`"fixtures"."kickoff_at" >= NOW() - INTERVAL '180 days'`);
    expect(q).toContain(`"fixtures"."kickoff_at" <= NOW() + INTERVAL '14 days'`);
  });

  it('keeps Morocco and senior national sides', () => {
    expect(q).toContain('"fixtures"."home_team_id" = 31');
    expect(q).toContain('"fixtures"."away_team_id" = 31');
    expect(q).toContain('COALESCE(nt.is_national, false)');
  });

  it('drops youth / women and finished games with no events and no lineups', () => {
    expect(q).toContain('COALESCE(wc.is_women, false)');
    expect(q).toContain('COALESCE(yt.is_women, false)');
    expect(q).toContain(String.raw`'(\mU-?(1[5-9]|2[0-3])\M|\sW$|women|ladies)'`);
    expect(q).toContain(`"fixtures"."status_code" IN ('FT', 'AET', 'PEN', 'AWD', 'WO')`);
    expect(q).toMatch(
      /NOT EXISTS \(SELECT 1 FROM fixture_events fe .*NOT EXISTS \(SELECT 1 FROM fixture_lineups fl/,
    );
  });

  it('youth/women name pattern matches the real API-Football names', () => {
    const re = /(\bU-?(1[5-9]|2[0-3])\b|\sW$|women|ladies)/i; // JS twin of the Postgres regex
    for (const n of ['Japan U17', 'Romania U-19', 'Senegal W', 'Tunisia Women', 'Arsenal Ladies']) {
      expect(re.test(n)).toBe(true);
    }
    for (const n of ['Morocco', 'Wydad AC', 'Bayern Munich', 'Union Berlin', 'Wolves']) {
      expect(re.test(n)).toBe(false);
    }
  });
});

describe('isMatchIndexable', () => {
  it('short-circuits featured competitions without a query', async () => {
    const { db, execute } = fakeDb(false);
    expect(await isMatchIndexable(db, 1, 200)).toBe(true);
    expect(execute).not.toHaveBeenCalled();
  });

  it('runs the exact sitemap condition for other fixtures', async () => {
    const { db, execute } = fakeDb(true);
    expect(await isMatchIndexable(db, 1610877, 10)).toBe(true);
    const sent = render(execute.mock.calls[0][0]);
    expect(sent).toContain(render(matchIndexableSitemapCondition));
    expect(sent).toMatch(/FROM fixtures WHERE "fixtures"\."id" = \$\d+$/);
  });
});

describe('player index policy', () => {
  const q = render(playerIndexableSitemapCondition);

  it('Moroccan nationals, or current team + current/previous season stats', () => {
    expect(q).toContain(`"players"."nationality_code" = 'MA'`);
    expect(q).toContain('"players"."current_team_id" IS NOT NULL');
    expect(q).toContain(
      `pss.season_year >= (EXTRACT(YEAR FROM NOW() - INTERVAL '6 months')::int) - 1`,
    );
    expect(q).not.toContain('transfers');
    expect(q).not.toContain('player_trophies');
  });

  it('isPlayerIndexable runs the same SQL and rejects placeholder slugs', async () => {
    const { db, execute } = fakeDb(true);
    expect(await isPlayerIndexable(db, 7, 'unknown-7')).toBe(false);
    expect(execute).not.toHaveBeenCalled();
    expect(await isPlayerIndexable(db, 8, 'achraf-hakimi-8')).toBe(true);
    expect(render(execute.mock.calls[0][0])).toContain(q);
  });
});
