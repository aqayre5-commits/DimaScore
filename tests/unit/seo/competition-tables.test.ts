import { describe, expect, it } from 'vitest';
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match';
import { COMPETITION_TAB_REDIRECT, isSeasonSegment } from '@/lib/seo/competition-tab-redirects';
import { competitionDisplayName } from '@/lib/competitions/display-name';
import { buildLeagueMeta } from '@/lib/seo/hub-metadata';
import ar from '@/lib/i18n/messages/ar.json';
import en from '@/lib/i18n/messages/en.json';
import fr from '@/lib/i18n/messages/fr.json';

const match = getPathMatch(COMPETITION_TAB_REDIRECT.source);

function target(pathname: string): string | null {
  const params = match(pathname);
  if (!params) return null;
  return COMPETITION_TAB_REDIRECT.destination.replace(
    /:([a-z]+)/g,
    (_, k: string) => params[k] as string,
  );
}

describe('accidental competition tab URLs (R6)', () => {
  it('is a 301, not a 308', () => {
    expect(COMPETITION_TAB_REDIRECT.statusCode).toBe(301);
  });

  it.each(['fixtures', 'standings', 'stats'])('sends /%s to the hub in one hop', (tab) => {
    expect(target(`/en/competition/morocco/botola-pro/${tab}`)).toBe(
      '/en/competition/morocco/botola-pro',
    );
    expect(target(`/fr/competition/angleterre/premier-league/${tab}`)).toBe(
      '/fr/competition/angleterre/premier-league',
    );
  });

  it('keeps encoded Arabic slugs untouched', () => {
    const country = encodeURIComponent('إنجلترا');
    const league = encodeURIComponent('الدوري-الإنجليزي-الممتاز');
    expect(target(`/ar/competition/${country}/${league}/standings`)).toBe(
      `/ar/competition/${country}/${league}`,
    );
  });

  it('never touches real season years, the bracket or other locales', () => {
    expect(target('/en/competition/morocco/botola-pro/2025')).toBeNull();
    expect(target('/en/competition/fifa/world-cup-2026/bracket')).toBeNull();
    expect(target('/de/competition/morocco/botola-pro/standings')).toBeNull();
    expect(target('/en/competition/morocco/botola-pro/standings/extra')).toBeNull();
  });

  it('treats only four-digit years as season segments', () => {
    expect(isSeasonSegment('2025')).toBe(true);
    expect(isSeasonSegment('standings')).toBe(false);
    expect(isSeasonSegment('20251')).toBe(false);
    expect(isSeasonSegment('')).toBe(false);
  });
});

describe('competition display name', () => {
  it('prefers a stored name for the locale, then the menu label, then English', () => {
    expect(competitionDisplayName({ en: 'Premier League', ar: 'البريميرليغ' }, 'ar', 'x')).toBe(
      'البريميرليغ',
    );
    expect(competitionDisplayName({ en: 'Premier League' }, 'ar', 'الدوري الإنجليزي الممتاز')).toBe(
      'الدوري الإنجليزي الممتاز',
    );
    expect(competitionDisplayName({ en: 'Premier League' }, 'fr', null)).toBe('Premier League');
    expect(competitionDisplayName(null, 'en', null, 'fallback')).toBe('fallback');
  });
});

describe('league hub titles are standings-first in every locale', () => {
  it('leads with the table', () => {
    const vars = { seasonLabel: '2026/27' };
    expect(buildLeagueMeta({ competition: 'Ligue 1', locale: 'fr', ...vars }).title).toMatch(
      /^Classement Ligue 1 2026\/27/,
    );
    expect(buildLeagueMeta({ competition: 'الدوري الفرنسي', locale: 'ar', ...vars }).title).toMatch(
      /^ترتيب الدوري الفرنسي 2026\/27/,
    );
    expect(buildLeagueMeta({ competition: 'Ligue 1', locale: 'en', ...vars }).title).toMatch(
      /^Ligue 1 2026\/27 table/,
    );
  });

  it('ships the table copy in all three message packs', () => {
    for (const pack of [en, fr, ar]) {
      for (const key of [
        'tableHeading',
        'tableCaption',
        'fixturesHeading',
        'roundResultsHeading',
      ]) {
        expect((pack.leaguePage as Record<string, string>)[key]).toEqual(expect.any(String));
      }
      expect(pack.leaguePage.tableHeading).toContain('{competition}');
      expect(pack.leaguePage.tableHeading).toContain('{season}');
    }
  });
});
