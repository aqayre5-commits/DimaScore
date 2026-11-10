import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

vi.mock('next/cache', () => ({ cacheLife: vi.fn() }));
const execute = vi.fn();
vi.mock('@/lib/db/client', () => ({ db: { execute: (q: SQL) => execute(q) } }));

import { getTodaysMatchLinks, TODAYS_MATCH_LINKS_MAX } from '@/lib/db/queries/todays-match-links';
import { matchIndexableSitemapCondition } from '@/lib/seo/indexable';

const dialect = new PgDialect();
const render = (q: SQL) => dialect.sqlToQuery(q);
const squash = (s: string) => s.replace(/\s+/g, ' ');

beforeEach(() => execute.mockReset());

describe('getTodaysMatchLinks', () => {
  it("queries today's Casablanca day + live, ranks live then indexable, caps at 24", async () => {
    execute.mockResolvedValue({ rows: [] });
    await getTodaysMatchLinks();
    const { sql, params } = render(execute.mock.calls[0][0]);
    const q = squash(sql);
    expect(TODAYS_MATCH_LINKS_MAX).toBe(24);
    expect(q).toContain("date_trunc('day', NOW() AT TIME ZONE 'Africa/Casablanca')");
    expect(q).toContain(squash(render(matchIndexableSitemapCondition).sql));
    expect(q).toMatch(/ORDER BY live DESC, indexable DESC/);
    expect(q).toMatch(/LIMIT \$\d+$/);
    expect(params.at(-1)).toBe(24);
  });

  it('maps rows and never throws', async () => {
    execute.mockResolvedValueOnce({
      rows: [
        {
          id: '1610877',
          home_slug: 'canada-5529',
          away_slug: 'chile-2383',
          home_name: { en: 'Canada' },
          home_short: {},
          home_code: 'CAN',
          away_name: { en: 'Chile' },
          away_short: {},
          away_code: 'CHI',
          live: true,
          indexable: true,
        },
      ],
    });
    const [m] = await getTodaysMatchLinks();
    expect(m).toMatchObject({ id: 1610877, homeSlug: 'canada-5529', live: true, indexable: true });
    execute.mockRejectedValueOnce(new Error('db down'));
    expect(await getTodaysMatchLinks()).toEqual([]);
  });
});
