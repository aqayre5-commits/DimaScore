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
  const VIEW = read('src/components/home/HomePage.tsx');
  const inView = (needle: string) => {
    const i = VIEW.indexOf(needle);
    expect(i, `${needle} missing from HomePage.tsx`).toBeGreaterThan(-1);
    return i;
  };

  it('renders the redesigned Home (rail, then the Home view), not the old homepage', () => {
    expect(PAGE).not.toMatch(/<HomeFeatured|<HomeMatchTabs|<LeagueLeftRail|<HomeRailWidgets/);
    expect(at('<CompetitionRail')).toBeLessThan(at('<HomeView'));
  });

  it('reads: H1, featured match, coming up, matches, live standings', () => {
    const order = [
      '<h1',
      'className="feature"',
      'className="soon"',
      'className="matches"',
      'className="standings"',
    ].map(inView);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('the page is laid out by DOM order and grid areas, not by CSS order', () => {
    const css = read('src/components/home/home-page.css');
    expect(css).not.toMatch(/\border\s*:/);
    expect(VIEW).not.toMatch(/flex-col-reverse|flex-row-reverse/);
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
