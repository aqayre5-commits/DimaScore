import { createElement, type ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import ar from '@/lib/i18n/messages/ar.json';
import en from '@/lib/i18n/messages/en.json';
import fr from '@/lib/i18n/messages/fr.json';
import { ScoreHeader } from '@/components/match/ScoreHeader';
import type { MatchDetail } from '@/lib/db/queries/match-detail';
import { crestAlt, goalMarker, matchupLabel } from '@/lib/i18n/feed-labels';
import type { Locale } from '@/lib/i18n/config';
import { flagImageSrc } from '@/components/shared/Flag';

// Match page leftovers from the post-#54 check: "vs" in the Arabic breadcrumb / schema names,
// "(P)" and "(OG)" after Arabic scorer names, and crests without alt text.

const MESSAGES = { ar, en, fr } as const;
function render(locale: Locale, el: ReturnType<typeof createElement>) {
  const props = {
    locale,
    messages: MESSAGES[locale],
    timeZone: 'Africa/Casablanca',
  } as unknown as ComponentProps<typeof NextIntlClientProvider>;
  return renderToStaticMarkup(createElement(NextIntlClientProvider, props, el));
}

const team = (id: number, en: string, arName: string, isNational: boolean) => ({
  id,
  slug: `${en.toLowerCase()}-${id}`,
  name: { en, fr: en, ar: arName },
  shortName: { en, fr: en, ar: arName },
  code: en.slice(0, 3).toUpperCase(),
  countryCode: isNational ? 'MA' : 'GB',
  logoUrl: `https://media.api-sports.io/football/teams/${id}.png`,
  isNational,
});

const match = {
  id: 1,
  kickoffAt: new Date('2026-11-21T15:00:00Z'),
  statusCode: 'HT',
  minute: 45,
  extraMinute: null,
  round: 'Regular Season - 12',
  groupLabel: null,
  referee: null,
  homeScore: 0,
  awayScore: 1,
  homeScoreHt: 0,
  awayScoreHt: 1,
  homeScoreFt: null,
  awayScoreFt: null,
  homeScoreEt: null,
  awayScoreEt: null,
  homeScorePen: null,
  awayScorePen: null,
  homeTeam: team(50, 'Manchester City', 'مانشستر سيتي', false),
  awayTeam: team(36, 'Fulham', 'فولهام', false),
  competition: {
    id: 39,
    slug: 'premier-league',
    name: { en: 'Premier League' },
    countryCode: 'GB',
    logoUrl: null,
  },
  venue: { id: 1, name: 'Etihad Stadium', city: 'Manchester', capacity: 55097, imageUrl: null },
  seasonYear: 2026,
} as unknown as MatchDetail;

const goals = [
  {
    playerName: 'ر. خيمينيز',
    minute: 23,
    extraMinute: null,
    isOwnGoal: false,
    isPenalty: true,
    teamId: 36,
  },
  {
    playerName: 'ر. دياز',
    minute: 40,
    extraMinute: null,
    isOwnGoal: true,
    teamId: 36,
    isPenalty: false,
  },
];

describe('ScoreHeader scorer markers and crest alt text', () => {
  it('has no (P) / (OG) on /ar, and Arabic alt text on both crests', () => {
    const html = render(
      'ar',
      createElement(ScoreHeader, { match, locale: 'ar', goalScorers: goals }),
    );
    expect(html).not.toContain('(P)');
    expect(html).not.toContain('(OG)');
    expect(html).toContain('(ج.ت)');
    expect(html).toContain('(هـ.ذ)');
    expect(html).toContain('alt="شعار مانشستر سيتي"');
    expect(html).toContain('alt="شعار فولهام"');
    expect(html).toMatch(/<img[^>]*alt="شعار فولهام"[^>]*width="\d+"[^>]*height="\d+"/);
  });

  it('uses the page language on /en and /fr', () => {
    const enHtml = render(
      'en',
      createElement(ScoreHeader, { match, locale: 'en', goalScorers: goals }),
    );
    expect(enHtml).toContain('(pen.)');
    expect(enHtml).toContain('(OG)');
    expect(enHtml).toContain('alt="Fulham crest"');
    const frHtml = render(
      'fr',
      createElement(ScoreHeader, { match, locale: 'fr', goalScorers: goals }),
    );
    expect(frHtml).toContain('(CSC)');
    expect(frHtml).toContain('alt="Logo : Fulham"');
  });
});

describe('fixture labels', () => {
  it('never says "vs" in Arabic', () => {
    expect(matchupLabel('المغرب', 'إسبانيا', 'ar')).toBe('المغرب ضد إسبانيا');
    expect(matchupLabel('Morocco', 'Spain', 'en')).toBe('Morocco vs Spain');
    expect(goalMarker('penalty', 'ar')).not.toMatch(/[A-Za-z]/);
    expect(goalMarker('ownGoal', 'ar')).not.toMatch(/[A-Za-z]/);
    expect(crestAlt('المغرب', 'ar', true)).toBe('علم المغرب');
  });
});

describe('flagImageSrc (the image the header shows, reused by the SportsEvent image)', () => {
  it('is the flag for a national team and the crest for a club', () => {
    expect(flagImageSrc({ countryCode: 'MA', logoUrl: 'https://x/31.png', isNational: true })).toBe(
      'https://media.api-sports.io/flags/ma.svg',
    );
    expect(
      flagImageSrc({ countryCode: 'GB', logoUrl: 'https://x/50.png', isNational: false }),
    ).toBe('https://x/50.png');
  });
});
