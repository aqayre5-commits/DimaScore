import { describe, expect, it } from 'vitest';
import { botolaProCompetitionHreflang } from '@/lib/seo/botola-classement';
import {
  canonicalCompetitionPath,
  canonicalCompetitionRedirect,
} from '@/lib/seo/competition-canonical';
import { resolveCompetitionEntry } from '@/lib/competitions/resolve-competition';
import { locales } from '@/lib/i18n/config';

describe('canonicalCompetitionRedirect', () => {
  it('301s an English URL that used the French country slug', () => {
    expect(canonicalCompetitionRedirect('/en/competition/maroc/botola-pro')).toBe(
      '/en/competition/morocco/botola-pro',
    );
  });

  it('301s a French URL that used the English country slug, and keeps a season suffix', () => {
    expect(canonicalCompetitionRedirect('/fr/competition/morocco/botola-pro/2025')).toBe(
      '/fr/competition/maroc/botola-pro/2025',
    );
  });

  it('301s the Arabic-script Botola URL to the Latin hub the hreflang cluster uses', () => {
    const target = canonicalCompetitionRedirect(
      '/ar/competition/المغرب/البطولة-الاحترافية',
    );
    expect(target).toBe('/ar/competition/maroc/botola-pro');
    const languages = botolaProCompetitionHreflang('https://dimascore.ma');
    for (const locale of locales) {
      const entry = resolveCompetitionEntry('botola-pro');
      expect(entry).toBeTruthy();
      expect(`https://dimascore.ma${canonicalCompetitionPath(entry!, locale)}`).toBe(
        languages[locale],
      );
    }
  });

  it('leaves the canonical URL alone and ignores unknown tournaments', () => {
    expect(canonicalCompetitionRedirect('/en/competition/morocco/botola-pro')).toBeNull();
    expect(canonicalCompetitionRedirect('/en/competition/england/not-a-league')).toBeNull();
    expect(canonicalCompetitionRedirect('/en/equipe/raja-ca-31')).toBeNull();
  });

  it('301s a Premier League URL that used the wrong country slug', () => {
    expect(canonicalCompetitionRedirect('/fr/competition/england/premier-league')).toBe(
      '/fr/competition/angleterre/premier-league',
    );
  });
});
