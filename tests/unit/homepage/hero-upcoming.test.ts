import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { HomeFixture } from '@/lib/db/queries/homepage';

// The hero card shows upcoming matches only. Live matches live on the live card, the Live tab and
// the ticker. These tests render the real component on the server (the HTML crawlers and the
// first paint get) and read the real query source.
vi.mock('@/hooks/useLiveFixtures', () => ({
  useLiveFixtures: () => new Map(),
  useLiveFeedReady: () => false,
}));

const FUTURE = new Date(Date.now() + 3 * 3_600_000);
const team = (id: number, name: string) => ({
  id,
  slug: `t${id}`,
  name: { en: name, fr: name, ar: name },
  shortName: { en: name, fr: name, ar: name },
  code: name.slice(0, 3).toUpperCase(),
  countryCode: 'MA',
  logoUrl: null,
  isNational: false,
});
function fixture(id: number, statusCode: string, home: string, away: string): HomeFixture {
  return {
    id,
    kickoffAt: FUTURE,
    statusCode,
    minute: statusCode === 'NS' ? null : 33,
    round: null,
    groupLabel: null,
    contextLabel: null,
    isFeatured: false,
    featureTag: null,
    homeTeamId: id * 10,
    awayTeamId: id * 10 + 1,
    homeScore: statusCode === 'NS' ? null : 1,
    awayScore: statusCode === 'NS' ? null : 0,
    homeScorePen: null,
    awayScorePen: null,
    homeTeam: team(id * 10, home),
    awayTeam: team(id * 10 + 1, away),
    competition: {
      id: 1,
      name: { en: 'League', fr: 'Ligue', ar: 'الدوري' },
      slug: 'league',
      countryCode: 'MA',
      logoUrl: null,
      displayPriority: 1,
    },
    venueName: null,
    venueCity: null,
    venueCapacity: null,
  } as HomeFixture;
}

const labels = {
  matchOfDay: 'Match of the day',
  featured: 'Featured',
  kicksOffIn: 'Kicks off in',
  countdownDays: 'Days',
  countdownHours: 'Hours',
  countdownMins: 'Mins',
  tags: { atlasLions: 'a', atlasClub: 'b', derby: 'c', knockout: 'd', opener: 'e' },
  heading: 'Upcoming matches',
  empty: { title: 'No upcoming matches right now', cta: "See today's matches" },
};

async function render(matches: HomeFixture[]) {
  const { HomeFeatured } = await import('@/components/homepage/HomeFeatured');
  return renderToStaticMarkup(
    createElement(HomeFeatured, { matches, locale: 'en', now: Date.now(), labels }),
  );
}

describe('home hero card: upcoming only', () => {
  it('leads with the first upcoming match, never a live one, even when the live match ranks first', async () => {
    const html = await render([
      fixture(1, '2H', 'LiveHome', 'LiveAway'),
      fixture(2, 'NS', 'SoonHome', 'SoonAway'),
    ]);
    expect(html).toContain('SoonHome');
    expect(html).not.toContain('LiveHome');
    expect(html).not.toContain('Live now');
    expect(html).toContain('Kicks off in');
    expect(html).toContain('<h2 class="sr-only">Upcoming matches</h2>');
  });

  it('shows no score, live line or scorer list', async () => {
    const html = await render([fixture(2, 'NS', 'SoonHome', 'SoonAway')]);
    expect(html).toContain('VS');
    expect(html).not.toMatch(/No goals yet|1st half|Half-time|animate-pulse/);
  });

  it('renders an empty state with the same minimum height when only live or finished matches are passed', async () => {
    for (const list of [
      [],
      [fixture(1, '1H', 'A', 'B')],
      [fixture(3, 'FT', 'C', 'D'), fixture(4, 'HT', 'E', 'F')],
    ]) {
      const html = await render(list);
      expect(html).toContain('No upcoming matches right now');
      expect(html).toContain('href="#matches"');
      expect(html).toContain('min-h-[380px]'); // same reserved height as the card
      expect(html).toContain('Upcoming matches'); // the H2 is there in the empty state too
    }
  });

  it('keeps the pager row height with a single slide (no shift if a slide drops out later)', async () => {
    const html = await render([fixture(2, 'NS', 'SoonHome', 'SoonAway')]);
    expect(html).toContain('class="mt-2 h-2"');
  });
});

describe('hero query', () => {
  const src = readFileSync(join(process.cwd(), 'src/lib/db/queries/homepage.ts'), 'utf8');
  const fn = src.slice(src.indexOf('export async function getFeaturedMatches'));
  const where = fn.slice(fn.indexOf('.where('), fn.indexOf('.orderBy('));

  it('selects only scheduled (NS) future fixtures: no live codes in the featured query', () => {
    expect(where).toContain("eq(schema.fixtures.statusCode, 'NS')");
    expect(where).not.toMatch(/LIVE_CODES|inArray/);
  });
});
