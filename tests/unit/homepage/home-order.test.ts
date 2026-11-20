import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useLiveFixtures', () => ({
  useLiveFixtures: () => new Map(),
  useLiveFeedReady: () => false,
}));

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const PAGE = read('src/app/[locale]/(app)/page.tsx');
const at = (needle: string) => {
  const i = PAGE.indexOf(needle);
  expect(i, `${needle} missing from page.tsx`).toBeGreaterThan(-1);
  return i;
};

describe('home page order (DOM order = visual order)', () => {
  it('main column reads: H1, hero, live card, matches, Morocco/Botola table, rest, videos', () => {
    const order = [
      '<h1',
      '<HomeFeatured',
      '<HomeNextMatch',
      'id="matches"',
      'variant="mobile"',
      '<HomeDeferredVideos',
    ].map(at);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('the page is laid out by DOM order, not by CSS order', () => {
    expect(PAGE).not.toMatch(/\border-(1|2|3|first|last)\b/);
    expect(PAGE).not.toMatch(/flex-col-reverse|flex-row-reverse/);
  });

  it('the left rail and the right rail sit in the DOM where they sit on screen (rail, main, rail)', () => {
    const left = at('<LeagueLeftRail');
    const main = at('<h1');
    const right = at('variant="desktop"');
    expect(left).toBeLessThan(main);
    expect(main).toBeLessThan(right);
  });

  it('the rail group labels are not headings on the home page, so the H1 is the first heading', () => {
    expect(PAGE).toContain('groupHeading="p"');
    expect(PAGE.indexOf('<h1')).toBeLessThan(PAGE.indexOf('<h2'));
  });

  it('the live card is live-only on mobile and in the desktop rail', () => {
    expect(PAGE).toMatch(/<HomeNextMatch[\s\S]*?liveOnly/);
    expect(read('src/components/homepage/HomeRailWidgets.tsx')).toMatch(
      /<HomeNextMatch[\s\S]*?liveOnly/,
    );
  });

  it('mobile rail widgets: Botola table first, then FIFA ranking, then top performances', () => {
    expect(read('src/components/homepage/HomeRailWidgets.tsx')).toContain(
      "mobile: ['leagueSnapshot', 'fifaRanking', 'topPerformances']",
    );
  });
});

describe('HomeNextMatch liveOnly', () => {
  const candidate = (id: number, statusCode: string) => ({
    goals: [],
    match: {
      id,
      kickoffAt: new Date(Date.now() + 3_600_000),
      statusCode,
      minute: statusCode === 'NS' ? null : 33,
      homeScore: statusCode === 'NS' ? null : 1,
      awayScore: statusCode === 'NS' ? null : 0,
      homeTeam: { id: 1, slug: 'h', name: { en: 'Hh' }, shortName: { en: 'Hh' }, code: 'HH' },
      awayTeam: { id: 2, slug: 'a', name: { en: 'Aa' }, shortName: { en: 'Aa' }, code: 'AA' },
      competition: { id: 1, name: { en: 'L' }, slug: 'l' },
    },
  });
  const labels = { nextMatch: 'Next match', liveNow: 'Live now', viewMatch: 'View match' };
  const render = async (candidates: unknown[], liveOnly: boolean) => {
    const { HomeNextMatch } = await import('@/components/homepage/HomeNextMatch');
    return renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: new QueryClient() },
        createElement(HomeNextMatch, {
          candidates: candidates as never,
          locale: 'en',
          liveOnly,
          labels,
        }),
      ),
    );
  };

  it('renders nothing when no candidate is live', async () => {
    expect(await render([candidate(1, 'NS'), candidate(2, 'NS')], true)).toBe('');
  });
  it('picks the live candidate even when an upcoming one ranks first', async () => {
    const html = await render([candidate(1, 'NS'), candidate(2, '2H')], true);
    expect(html).toContain('Live now');
    expect(html).not.toContain('Next match');
  });
  it('still shows "Next match" elsewhere (liveOnly off)', async () => {
    expect(await render([candidate(1, 'NS')], false)).toContain('Next match');
  });
});
