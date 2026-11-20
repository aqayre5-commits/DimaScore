import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HomeFixture } from '@/lib/db/queries/homepage';

// With cacheComponents, a Client Component that reads the clock (`Date.now()`, `new Date()`,
// `Date()`) while it is prerendered aborts the nearest Suspense boundary. On the home page that
// boundary is the route's loading.tsx, so the H1, the hero card and the match list left the first
// HTML (they were only in the RSC payload). The home client components must take "now" as a prop
// until mount (useRenderNow). This renders them on the server with a clock that throws, the way
// Next's prerender treats it.
vi.mock('@/hooks/useLiveFixtures', () => ({
  useLiveFixtures: () => new Map(),
  useLiveFeedReady: () => false,
}));
vi.mock('next-intl', () => ({ useTranslations: () => (k: string) => k }));

const NOW = Date.parse('2026-11-20T12:00:00Z');
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
function fixture(id: number, statusCode: string, kickoffMs: number): HomeFixture {
  return {
    id,
    kickoffAt: new Date(kickoffMs),
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
    homeTeam: team(id * 10, `Home${id}`),
    awayTeam: team(id * 10 + 1, `Away${id}`),
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

const RealDate = Date;
/** Swap in a Date whose clock reads throw (dated constructors still work). */
function trapClock() {
  const clockRead = () => {
    throw new Error('read the clock during a server render');
  };
  const Trapped = function (this: unknown, ...args: unknown[]) {
    if (!new.target || args.length === 0) clockRead();
    return Reflect.construct(RealDate, args, new.target);
  } as unknown as DateConstructor;
  Object.setPrototypeOf(Trapped, RealDate);
  Object.defineProperty(Trapped, 'prototype', { value: RealDate.prototype });
  Trapped.now = clockRead;
  globalThis.Date = Trapped;
}
afterEach(() => {
  globalThis.Date = RealDate;
});

const upcoming = fixture(1, 'NS', NOW + 3 * 3_600_000);
const live = fixture(2, '2H', NOW - 3_600_000);
const finished = fixture(3, 'FT', NOW - 4 * 3_600_000);

const heroLabels = {
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
const tabLabels = {
  all: 'All',
  live: 'Live',
  upcoming: 'Upcoming',
  results: 'Results',
  today: 'Today',
  yesterday: 'Yesterday',
  tomorrow: 'Tomorrow',
  viewFullSchedule: 'View full schedule',
  showLess: 'Show less',
  noMatches: 'No matches',
  noMatchesToday: 'No matches today',
  emptyState: 'Nothing here',
  yourMatches: 'Your matches',
};

describe('home client components render without reading the clock (prerenderable)', () => {
  it('hero card, with its countdown from the server time', async () => {
    const { HomeFeatured } = await import('@/components/homepage/HomeFeatured');
    trapClock();
    const html = renderToStaticMarkup(
      createElement(HomeFeatured, {
        matches: [upcoming],
        locale: 'en',
        now: NOW,
        labels: heroLabels,
      }),
    );
    globalThis.Date = RealDate;
    expect(html).toContain('<h2 class="sr-only">Upcoming matches</h2>');
    expect(html).toContain('Home1');
    expect(html).toContain('href="/en/');
    // 3 hours to kick-off from the server time: 0 days, 3 hours, 0 minutes.
    expect(html).toMatch(/>03<\/span>/);
  });

  it('hero empty state', async () => {
    const { HomeFeatured } = await import('@/components/homepage/HomeFeatured');
    trapClock();
    const html = renderToStaticMarkup(
      createElement(HomeFeatured, { matches: [], locale: 'en', now: NOW, labels: heroLabels }),
    );
    globalThis.Date = RealDate;
    expect(html).toContain('No upcoming matches right now');
    expect(html).toContain('href="#matches"');
  });

  it('match list, with its match links', async () => {
    const { HomeMatchTabs } = await import('@/components/homepage/HomeMatchTabs');
    const queryClient = new QueryClient();
    trapClock();
    const html = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(HomeMatchTabs, {
          live: [live],
          upcoming: [upcoming],
          results: [finished],
          locale: 'en',
          now: NOW,
          labels: tabLabels,
        }),
      ),
    );
    globalThis.Date = RealDate;
    for (const name of ['Home1', 'Home2', 'Home3']) expect(html).toContain(name);
    expect(html.match(/<a [^>]*href="\/en\/[^"]+"/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  });
});
