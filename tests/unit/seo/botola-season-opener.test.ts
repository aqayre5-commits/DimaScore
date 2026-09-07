import { describe, expect, it } from 'vitest';
import ar from '@/lib/i18n/messages/ar.json';
import en from '@/lib/i18n/messages/en.json';
import fr from '@/lib/i18n/messages/fr.json';
import {
  BOTOLA_COMPETITION_HUB,
  BOTOLA_SEASON_OPENER_FR_ALIAS,
  BOTOLA_SEASON_OPENER_HIGHLIGHTS,
  BOTOLA_SEASON_OPENER_SLUGS,
  BOTOLA_SEASON_OPENER_START_ISO,
  BOTOLA_SEASON_OPENER_YEAR,
  botolaCompetitionFixturesHref,
  botolaCompetitionStandingsHref,
  botolaSeasonOpenerHreflang,
  botolaSeasonOpenerPath,
  isBotolaSeasonOpenerSlug,
  rewriteBotolaSeasonOpenerPath,
} from '@/lib/seo/botola-season-opener';

const CLOCK_RE = /\b\d{1,2}:\d{2}\b|\b\d{1,2}h\d{2}\b/i;
const ODDS_UI_RE = /\b(odds|cotes?)\b.*\b(bookmaker|pari|betting)\b/i;

describe('botola season opener routes', () => {
  it('uses the canonical FR/EN/AR slugs from IMP-006', () => {
    expect(botolaSeasonOpenerPath('fr')).toBe('/fr/calendrier-botola-pro-2026-2027');
    expect(botolaSeasonOpenerPath('en')).toBe('/en/botola-pro-2026-27-calendar');
    expect(botolaSeasonOpenerPath('ar')).toBe('/ar/calendrier-botola-pro-2026-2027');
  });

  it('keeps the AR path on a Latin slug', () => {
    expect(BOTOLA_SEASON_OPENER_SLUGS.ar).toBe(BOTOLA_SEASON_OPENER_SLUGS.fr);
    expect(BOTOLA_SEASON_OPENER_SLUGS.ar).toMatch(/^[a-z0-9-]+$/);
  });

  it('maps hreflang with x-default to FR', () => {
    const languages = botolaSeasonOpenerHreflang('https://dimascore.ma');
    expect(languages.fr).toBe('https://dimascore.ma/fr/calendrier-botola-pro-2026-2027');
    expect(languages.en).toBe('https://dimascore.ma/en/botola-pro-2026-27-calendar');
    expect(languages.ar).toBe('https://dimascore.ma/ar/calendrier-botola-pro-2026-2027');
    expect(languages['x-default']).toBe(languages.fr);
  });

  it('recognizes the optional FR 301 alias', () => {
    expect(BOTOLA_SEASON_OPENER_FR_ALIAS).toBe('reprise-botola-pro-2026-2027');
    expect(isBotolaSeasonOpenerSlug(BOTOLA_SEASON_OPENER_FR_ALIAS)).toBe(true);
  });

  it('rewrites language-switcher paths to the locale canonical', () => {
    expect(rewriteBotolaSeasonOpenerPath('/fr/calendrier-botola-pro-2026-2027', 'en')).toBe(
      '/en/botola-pro-2026-27-calendar',
    );
    expect(rewriteBotolaSeasonOpenerPath('/en/botola-pro-2026-27-calendar', 'ar')).toBe(
      '/ar/calendrier-botola-pro-2026-2027',
    );
    expect(rewriteBotolaSeasonOpenerPath('/fr/reprise-botola-pro-2026-2027', 'fr')).toBe(
      '/fr/calendrier-botola-pro-2026-2027',
    );
    expect(rewriteBotolaSeasonOpenerPath('/fr/lions-abroad', 'en')).toBeNull();
  });
});

describe('botola season opener hubs', () => {
  it('CTAs point at the brief competition hubs + Matchs/Classement hashes', () => {
    expect(BOTOLA_COMPETITION_HUB.fr).toBe('/fr/competition/maroc/botola-pro');
    expect(BOTOLA_COMPETITION_HUB.en).toBe('/en/competition/morocco/botola-pro');
    expect(BOTOLA_COMPETITION_HUB.ar).toBe('/ar/competition/maroc/botola-pro');
    expect(botolaCompetitionFixturesHref('fr')).toBe('/fr/competition/maroc/botola-pro#matchs');
    expect(botolaCompetitionStandingsHref('en')).toBe(
      '/en/competition/morocco/botola-pro#standings',
    );
    expect(botolaCompetitionFixturesHref('ar')).toBe('/ar/competition/maroc/botola-pro#المباريات');
  });
});

describe('botola season opener copy (LANG-018)', () => {
  const packs = {
    fr: fr.botolaSeasonOpener,
    en: en.botolaSeasonOpener,
    ar: ar.botolaSeasonOpener,
  };

  it('shares the same keys across FR/EN/AR', () => {
    const frKeys = Object.keys(packs.fr).sort();
    expect(Object.keys(packs.en).sort()).toEqual(frKeys);
    expect(Object.keys(packs.ar).sort()).toEqual(frKeys);
  });

  it('uses the locked meta titles and H1s', () => {
    expect(packs.fr.metaTitle).toBe(
      'Calendrier Botola Pro 2026/2027 : reprise le 24 sept. | DimaScore',
    );
    expect(packs.en.metaTitle).toBe(
      'Botola Pro 2026/27 calendar: season starts 24 Sep | DimaScore',
    );
    expect(packs.ar.metaTitle).toBe('برنامج البطولة 2026/2027: الانطلاق 24 شتنبر | ديماسكور');
    expect(packs.fr.h1).toBe('Calendrier Botola Pro 2026/2027 : date de reprise & affiches');
    expect(packs.en.h1).toBe('Botola Pro 2026/27 season start');
    expect(packs.ar.h1).toBe('برنامج البطولة الاحترافية 2026/2027');
  });

  it('SSR lead answers the LNFP 24 Sep 2026 start without inventing kickoffs', () => {
    expect(BOTOLA_SEASON_OPENER_YEAR).toBe(2026);
    expect(BOTOLA_SEASON_OPENER_START_ISO).toBe('2026-09-24');
    expect(packs.fr.lead).toMatch(/LNFP/);
    expect(packs.fr.lead).toMatch(/24 septembre 2026/);
    expect(packs.en.lead).toMatch(/24 September 2026/);
    expect(packs.ar.lead).toMatch(/24 شتنبر 2026/);
    for (const pack of Object.values(packs)) {
      const blob = Object.entries(pack)
        .filter(([key]) => key !== 'widgetNote')
        .map(([, value]) => value)
        .join('\n');
      expect(blob).not.toMatch(CLOCK_RE);
      expect(blob.toLowerCase()).not.toContain('africa/casablanca');
    }
    expect(packs.fr.widgetNote).toContain('00:00');
  });

  it('keeps highlights round-level and kickoff-to-confirm', () => {
    expect(BOTOLA_SEASON_OPENER_HIGHLIGHTS.map((h) => h.id)).toEqual([
      'j1-far-raja',
      'j5-mas-berkane',
      'j8-wydad-far',
      'derby-casa',
    ]);
    expect(packs.fr.hl1pairing).toMatch(/FAR/);
    expect(packs.fr.hl4pairing).toMatch(/Casablanca/);
    expect(packs.fr.kickoffTbc).toMatch(/confirmer/i);
    expect(packs.en.kickoffTbc).toMatch(/confirm/i);
  });

  it('does not ship odds UI copy', () => {
    for (const pack of Object.values(packs)) {
      expect(Object.values(pack).join('\n')).not.toMatch(ODDS_UI_RE);
    }
  });
});
