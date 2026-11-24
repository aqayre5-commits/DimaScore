/**
 * Regression: match pages with partial provider data rendered a blank match centre (no h1, no
 * board) because one event named a player missing from the players table (name NULL) and the
 * incident builder indexed into it. Fixtures are the live payloads of the three reported pages;
 * the variants strip more data to make sure title, board and tabs always render.
 */
import { createElement as h } from 'react';
import { renderToString } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import en from '@/lib/i18n/messages/en.json';
import ar from '@/lib/i18n/messages/ar.json';
import { qk } from '@/lib/query-keys';
import { MatchCentre } from '@/components/match/centre/MatchCentre';
import ucl from './fixtures/ucl-unknown-card-player.json';
import wafcon from './fixtures/wafcon-women-unknown-sub.json';
import uel from './fixtures/uel-qualifier-no-lineups.json';

type Fixture = typeof ucl;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function render(f: Fixture, locale: 'en' | 'ar' = 'en', mutate?: (x: Any) => void) {
  const x: Any = structuredClone(f);
  x.props.match.locale = locale;
  mutate?.(x);
  const id = String(x.props.match.id);
  const qc = new QueryClient();
  qc.setQueryData(qk.matchEvents(id), x.events);
  qc.setQueryData(qk.matchLineups(id), x.lineups);
  qc.setQueryData(qk.matchStats(id), x.stats);
  const tree = h(QueryClientProvider, { client: qc }, h(MatchCentre, x.props));
  return renderToString(
    h(NextIntlClientProvider, {
      locale,
      messages: locale === 'ar' ? ar : en,
      timeZone: 'Africa/Casablanca',
      children: tree,
    }),
  );
}

const VARIANTS: Array<[string, (x: Any) => void]> = [
  ['as served', () => {}],
  [
    'every event player unknown',
    (x) =>
      x.events.forEach((e: Any) => {
        if (e.player) e.player.name = null;
        if (e.assist) e.assist.name = null;
      }),
  ],
  [
    'no events, line-ups or stats',
    (x) => {
      x.events = [];
      x.lineups = [];
      x.stats = { teamStats: [], playerStats: [] };
    },
  ],
  [
    'no coverage, venue, logos, table or upcoming',
    (x) => {
      x.props.match.coverage = null;
      x.props.match.venue = null;
      x.props.match.competition.logo = null;
      x.props.match.home.logo = null;
      x.props.match.away.logo = null;
      x.props.table = null;
      x.props.upcoming = [];
    },
  ],
  [
    'postponed, no score',
    (x) => {
      Object.assign(x.props.match, {
        phase: 'upcoming',
        statusCode: 'PST',
        homeScore: null,
        awayScore: null,
      });
    },
  ],
  ['one line-up only', (x) => (x.lineups = x.lineups.slice(0, 1))],
];

describe('match centre renders with partial data', () => {
  let errors: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => errors.mockRestore());

  for (const [name, f] of [
    ['ucl', ucl],
    ['wafcon', wafcon],
    ['uel', uel],
  ] as const)
    for (const [variant, mutate] of VARIANTS)
      for (const locale of ['en', 'ar'] as const)
        it(`${name} · ${variant} · ${locale}`, () => {
          const html = render(f as Fixture, locale, mutate);
          expect(html.match(/<h1\b/g)?.length).toBe(1);
          expect(html).toContain('mc-board');
          expect(html).toContain('data-mc-tab="overview"');
          expect(errors).not.toHaveBeenCalled();
        });
});
