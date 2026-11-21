import { createElement, type ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import ar from '@/lib/i18n/messages/ar.json';
import {
  localizeInjuryType,
  localizeMatchStatus,
  localizeRound,
  penaltySuffix,
  resultLetter,
} from '@/lib/i18n/feed-labels';
import { teamLabel } from '@/lib/i18n/localized-names';
import { WorldCupHistoryCard } from '@/components/team/WorldCupHistoryCard';
import { CupOverviewTab } from '@/components/tournament/CupOverviewTab';
import { CupFixturesTab } from '@/components/tournament/CupFixturesTab';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { StandingRow } from '@/lib/db/queries';
import type { TopPlayerRow } from '@/lib/db/queries/league';

vi.mock('@/hooks/useLiveFixtures', () => ({
  useLiveFixtures: () => new Map(),
  useLiveFeedReady: () => false,
}));

const LATIN = /[A-Za-z]{2,}/;

function withIntl(child: ReturnType<typeof createElement>) {
  const props = {
    locale: 'ar',
    messages: ar,
    timeZone: 'Africa/Casablanca',
  } as unknown as ComponentProps<typeof NextIntlClientProvider>;
  return createElement(NextIntlClientProvider, props, child);
}

describe('round labels the #53 pack did not list (Champions League, qualifiers, play-offs)', () => {
  it.each([
    ['League Stage - 1', 'مرحلة الدوري - الجولة 1'],
    ['1st Qualifying Round', 'الدور التأهيلي الأول'],
    ['4th Qualifying Round', 'الدور التأهيلي الرابع'],
    ['2nd Round', 'الدور الثاني'],
    ['Play-offs', 'الملحق'],
    ['Knockout Round Play-offs', 'ملحق الأدوار الإقصائية'],
    ['Play-offs - Semi-finals', 'الملحق - نصف النهائي'],
    ['Round 5', 'الجولة 5'],
    ['Round of 64', 'دور الـ64'],
    ['Group Stage', 'دور المجموعات'],
  ])('%s → %s', (en, expected) => {
    expect(localizeRound(en, 'ar')).toBe(expected);
    expect(localizeRound(en, 'en')).toBe(en);
    expect(localizeRound(en, 'fr')).toBe(en);
  });

  it('leaves a genuinely unknown label untouched rather than half-translating it', () => {
    expect(localizeRound('Apertura - Something New', 'ar')).toBe('Apertura - Something New');
  });
});

describe('suffixes and badges', () => {
  it('penalty shoot-out suffix is localised', () => {
    expect(penaltySuffix(2, 3, 'ar')).toBe('(ركلات الترجيح 2-3)');
    expect(penaltySuffix(2, 3, 'en')).toBe('(2-3 pen)');
    expect(penaltySuffix(2, 3, 'fr')).toBe('(2-3 t.a.b.)');
  });
  it('result letters and status badges', () => {
    expect(resultLetter('W', 'ar')).toBe('ف');
    expect(resultLetter('W', 'en')).toBe('W');
    expect(localizeMatchStatus('LIVE', 'ar')).toBe('مباشر');
    expect(localizeMatchStatus('AET', 'ar')).not.toMatch(LATIN);
    expect(localizeInjuryType('Missing Fixture', 'ar')).toBe('غائب');
    expect(localizeInjuryType('Missing Fixture', 'en')).toBe('Missing Fixture');
  });
});

describe('teamLabel (query rows and stats-feed team names)', () => {
  it('prefers the curated Arabic name over the English feed string', () => {
    expect(teamLabel({ id: 42, name: { en: 'Arsenal' } }, 'ar', 'Arsenal')).toBe('أرسنال');
    expect(teamLabel({ id: 42, name: { en: 'Arsenal' } }, 'en', 'x')).toBe('Arsenal');
    expect(teamLabel({ id: 42, name: { en: 'Arsenal', fr: 'Arsenal FC' } }, 'fr')).toBe(
      'Arsenal FC',
    );
    expect(teamLabel(null, 'ar', 'Arsenal')).toBe('Arsenal');
  });
  it('ignores a Latin copy stored in name.ar', () => {
    expect(teamLabel({ id: 999901, name: { en: 'Foo FC', ar: 'Foo FC' } }, 'ar')).toBe('Foo FC');
    expect(teamLabel({ id: 999901, name: { en: 'Foo FC', ar: 'فو' } }, 'ar')).toBe('فو');
  });
});

describe('rendered on /ar', () => {
  it('World Cup history: Arabic penalty suffix and result letter (/ar/equipe/morocco-31)', () => {
    const html = renderToStaticMarkup(
      createElement(WorldCupHistoryCard, {
        locale: 'ar',
        results: [
          {
            fixtureId: 1,
            kickoffAt: new Date('2022-12-06T15:00:00Z'),
            seasonYear: 2022,
            round: 'Round of 16',
            statusCode: 'PEN',
            home: {
              name: { en: 'Morocco', ar: 'المغرب' },
              logoUrl: null,
              slug: 'morocco',
              score: 0,
              pen: 3,
            },
            away: {
              name: { en: 'Spain', ar: 'Spain' },
              logoUrl: null,
              slug: 'spain',
              score: 0,
              pen: 0,
            },
            result: 'W',
          },
        ],
      } as Parameters<typeof WorldCupHistoryCard>[0]),
    );
    expect(html).toContain('(ركلات الترجيح 3-0)');
    expect(html).not.toContain(' pen)');
    expect(html).not.toContain('>W<');
    expect(html).toContain('دور الـ16');
  });

  it('cup overview: Arabic team names, column heads and top-scorer team', () => {
    const team = {
      id: 42,
      slug: 'arsenal',
      name: { en: 'Arsenal' },
      shortName: { en: 'Arsenal' },
      code: 'ARS',
      countryCode: 'GB',
      logoUrl: null,
      isNational: false,
    };
    const standings = [
      {
        groupLabel: 'League Stage',
        teamId: 42,
        rank: 1,
        points: 15,
        played: 5,
        won: 5,
        drawn: 0,
        lost: 0,
        goalsFor: 14,
        goalsAgainst: 1,
        goalDiff: 13,
        form: 'WWWWW',
        description: null,
        team,
      },
    ] as unknown as StandingRow[];
    const scorers: TopPlayerRow[] = [
      {
        playerId: 1,
        playerSlug: 'p-1',
        playerName: 'B. Saka',
        playerPhoto: null,
        teamName: teamLabel({ id: 42, name: { en: 'Arsenal' } }, 'ar', 'Arsenal'),
        teamLogo: null,
        goals: 5,
        assists: 2,
      },
    ];
    const html = renderToStaticMarkup(
      withIntl(
        createElement(CupOverviewTab, {
          fixtures: [],
          standings,
          topScorers: scorers,
          topAssists: [],
          coverage: null,
          locale: 'ar',
        }),
      ),
    );
    expect(html).toContain('أرسنال');
    expect(html).not.toContain('>Arsenal<');
    expect(html).not.toMatch(/>(P|W|D|L)<\/th>/);
  });

  it('cup fixtures: round dropdown uses the Arabic round labels', () => {
    const t = (id: number, en: string) => ({
      id,
      slug: `t${id}`,
      name: { en },
      shortName: { en },
      code: en.slice(0, 3).toUpperCase(),
      countryCode: 'GB',
      logoUrl: null,
      isNational: false,
    });
    const fx = (id: number, round: string, roundNumber: number, statusCode = 'FT') =>
      ({
        id,
        kickoffAt: new Date(Date.UTC(2026, 8, roundNumber, 19)),
        statusCode,
        minute: null,
        round,
        roundNumber,
        groupLabel: null,
        homeTeamId: 42,
        awayTeamId: 50,
        homeScore: 1,
        awayScore: 1,
        homeScorePen: null,
        awayScorePen: null,
        homeTeam: t(42, 'Arsenal'),
        awayTeam: t(50, 'Manchester City'),
        competition: {
          id: 2,
          name: { en: 'UEFA Champions League' },
          slug: 'ucl',
          countryCode: null,
          logoUrl: null,
        },
      }) as unknown as FixtureWithTeams;
    const html = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: new QueryClient() },
        withIntl(
          createElement(CupFixturesTab, {
            fixtures: [
              fx(1, '1st Qualifying Round', 1),
              fx(2, 'League Stage - 1', 2),
              fx(3, 'Play-offs', 3),
            ],
            locale: 'ar',
          }),
        ),
      ),
    );
    expect(html).toContain('الدور التأهيلي الأول');
    expect(html).toContain('مرحلة الدوري - الجولة 1');
    expect(html).toContain('الملحق');
    expect(html).not.toContain('League Stage');
    expect(html).not.toContain('Qualifying Round');
    expect(html).toContain('أرسنال');
  });
});
