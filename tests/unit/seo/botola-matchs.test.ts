import { describe, expect, it } from 'vitest';
import ar from '@/lib/i18n/messages/ar.json';
import en from '@/lib/i18n/messages/en.json';
import fr from '@/lib/i18n/messages/fr.json';
import {
  BOTOLA_COMPETITION_HUB,
  BOTOLA_SEASON_OPENER_COMPETITION_ID,
  BOTOLA_SEASON_OPENER_YEAR,
  botolaSeasonOpenerPath,
} from '@/lib/seo/botola-season-opener';
import { botolaClassementPath } from '@/lib/seo/botola-classement';
import { botola2CompetitionFixturesHref } from '@/lib/seo/botola-2-classement';
import {
  BOTOLA_MATCHS_EN_ALIAS,
  BOTOLA_MATCHS_FR_ALIAS,
  BOTOLA_MATCHS_SLUGS,
  botolaMatchsEmbedHash,
  botolaMatchsEmbedHashAliases,
  botolaMatchsHreflang,
  botolaMatchsPath,
  isBotolaMatchsSlug,
  rewriteBotolaMatchsPath,
} from '@/lib/seo/botola-matchs';

const ODDS_UI_RE = /\b(odds|cotes?)\b.*\b(bookmaker|pari|betting)\b/i;
const CLOCK_RE = /\b\d{1,2}:\d{2}\b|\b\d{1,2}h\d{2}\b/i;
const ELBOTOLA_RE = /elbotola|el botola/i;

describe('botola matchs routes (IMP-010)', () => {
  it('uses the canonical FR/EN/AR slugs', () => {
    expect(botolaMatchsPath('fr')).toBe('/fr/matchs-botola-pro');
    expect(botolaMatchsPath('en')).toBe('/en/botola-pro-matches');
    expect(botolaMatchsPath('ar')).toBe('/ar/matchs-botola-pro');
  });

  it('keeps the AR path on a Latin slug', () => {
    expect(BOTOLA_MATCHS_SLUGS.ar).toBe(BOTOLA_MATCHS_SLUGS.fr);
    expect(BOTOLA_MATCHS_SLUGS.ar).toMatch(/^[a-z0-9-]+$/);
  });

  it('maps hreflang with x-default to FR', () => {
    const languages = botolaMatchsHreflang('https://dimascore.ma');
    expect(languages.fr).toBe('https://dimascore.ma/fr/matchs-botola-pro');
    expect(languages.en).toBe('https://dimascore.ma/en/botola-pro-matches');
    expect(languages.ar).toBe('https://dimascore.ma/ar/matchs-botola-pro');
    expect(languages['x-default']).toBe(languages.fr);
  });

  it('recognizes the query-shaped 301 aliases', () => {
    expect(BOTOLA_MATCHS_FR_ALIAS).toBe('matchs-de-botola');
    expect(BOTOLA_MATCHS_EN_ALIAS).toBe('botola-pro-fixtures');
    expect(isBotolaMatchsSlug(BOTOLA_MATCHS_FR_ALIAS)).toBe(true);
    expect(isBotolaMatchsSlug(BOTOLA_MATCHS_EN_ALIAS)).toBe(true);
  });

  it('rewrites language-switcher paths to the locale canonical', () => {
    expect(rewriteBotolaMatchsPath('/fr/matchs-botola-pro', 'en')).toBe('/en/botola-pro-matches');
    expect(rewriteBotolaMatchsPath('/en/botola-pro-matches', 'ar')).toBe('/ar/matchs-botola-pro');
    expect(rewriteBotolaMatchsPath('/ar/matchs-botola-pro', 'fr')).toBe('/fr/matchs-botola-pro');
    expect(rewriteBotolaMatchsPath('/fr/matchs-de-botola', 'en')).toBe('/en/botola-pro-matches');
    expect(rewriteBotolaMatchsPath('/en/botola-pro-fixtures', 'fr')).toBe('/fr/matchs-botola-pro');
    expect(isBotolaMatchsSlug('matchs-botola-pro')).toBe(true);
    expect(rewriteBotolaMatchsPath('/fr/classement-botola-pro', 'en')).toBeNull();
    expect(rewriteBotolaMatchsPath('/fr/lions-abroad', 'en')).toBeNull();
  });

  it('binds the embed to Botola Pro 2026/27 SoT (comp 200)', () => {
    expect(BOTOLA_SEASON_OPENER_COMPETITION_ID).toBe(200);
    expect(BOTOLA_SEASON_OPENER_YEAR).toBe(2026);
  });
});

describe('botola matchs deep-link hashes', () => {
  it('uses locale fixtures hashes, not #fixtures alone on FR/AR', () => {
    expect(botolaMatchsEmbedHash('fr')).toBe('matchs');
    expect(botolaMatchsEmbedHash('ar')).toBe('المباريات');
    expect(botolaMatchsEmbedHash('en')).toBe('fixtures');
    expect(botolaMatchsEmbedHashAliases('fr')).toEqual(['fixtures']);
    expect(botolaMatchsEmbedHashAliases('ar')).toEqual(['fixtures']);
    expect(botolaMatchsEmbedHashAliases('en')).toEqual([]);
  });
});

describe('botola matchs hubs', () => {
  it('cross-links classement, calendrier, competition Matchs, and Botola 2 see-also', () => {
    expect(BOTOLA_COMPETITION_HUB.fr).toBe('/fr/competition/maroc/botola-pro');
    expect(BOTOLA_COMPETITION_HUB.en).toBe('/en/competition/morocco/botola-pro');
    expect(BOTOLA_COMPETITION_HUB.ar).toBe('/ar/competition/maroc/botola-pro');
    expect(botolaClassementPath('fr')).toBe('/fr/classement-botola-pro');
    expect(botolaSeasonOpenerPath('fr')).toBe('/fr/calendrier-botola-pro-2026-2027');
    expect(botola2CompetitionFixturesHref('fr')).toBe('/fr/competition/maroc/botola-2#matchs');
  });
});

describe('botola matchs copy', () => {
  const packs = {
    fr: fr.botolaMatchs,
    en: en.botolaMatchs,
    ar: ar.botolaMatchs,
  };

  it('shares the same keys across FR/EN/AR', () => {
    const frKeys = Object.keys(packs.fr).sort();
    expect(Object.keys(packs.en).sort()).toEqual(frKeys);
    expect(Object.keys(packs.ar).sort()).toEqual(frKeys);
  });

  it('uses titles that say matchs / مباريات, not only Botola Pro', () => {
    expect(packs.fr.metaTitle).toBe('Matchs Botola Pro en direct 2026/27 | DimaScore');
    expect(packs.ar.metaTitle).toBe('مباريات البطولة الاحترافية مباشرة 2026/27 | ديماسكور');
    expect(packs.en.metaTitle).toBe('Botola Pro matches live 2026/27 | DimaScore');
    expect(packs.fr.h1).toBe('Matchs Botola Pro en direct');
    expect(packs.ar.h1).toBe('مباريات البطولة الاحترافية مباشرة');
    expect(packs.fr.metaTitle).toMatch(/[Mm]atchs/);
    expect(packs.ar.metaTitle).toMatch(/مباريات/);
    expect(packs.fr.h1).toMatch(/[Mm]atchs/);
    expect(packs.ar.h1).toMatch(/مباريات/);
  });

  it('SSR lead answers live matchs + same SoT + free/no betting and points to classement + calendrier', () => {
    expect(packs.fr.lead).toMatch(/matchs et scores en direct/i);
    expect(packs.fr.lead).toMatch(/onglet Matchs/);
    expect(packs.fr.lead).toMatch(/sans paris|sans cotes/i);
    expect(packs.fr.lead).toMatch(/classement/);
    expect(packs.fr.lead).toMatch(/calendrier/);
    expect(packs.ar.lead).toMatch(/مباريات/);
    expect(packs.ar.lead).toMatch(/ترتيب/);
    expect(packs.ar.lead).toMatch(/برنامج/);
    expect(packs.fr.ctaCalendar).toMatch(/[Cc]alendrier/);
    expect(packs.fr.ctaClassementLanding).toMatch(/[Cc]lassement/);
    expect(packs.ar.ctaCalendar).toMatch(/برنامج/);
  });

  it('honest empty LIVE copy is not a blank page', () => {
    expect(packs.fr.fixturesEmpty).toMatch(/pas une page vide|s'afficheront/i);
    expect(packs.fr.faq2a).toMatch(/n'est pas une erreur|aucun match n'est en jeu/i);
    expect(packs.ar.fixturesEmpty).toMatch(/فارغة/);
  });

  it('does not invent kickoff clocks in editorial chrome (DATA-001)', () => {
    for (const pack of Object.values(packs)) {
      const blob = Object.entries(pack)
        .filter(([key]) => key !== 'widgetNote')
        .map(([, value]) => value)
        .join('\n');
      expect(blob).not.toMatch(CLOCK_RE);
      expect(blob.toLowerCase()).not.toContain('africa/casablanca');
    }
    expect(packs.fr.widgetNote).toContain('00:00');
    expect(packs.fr.widgetNote).toMatch(/horaire à confirmer/i);
    expect(packs.fr.faq3a).toMatch(/horaire à confirmer/i);
  });

  it('disambiguates Pro vs Botola 2 without inventing a second Pro fixtures pipeline', () => {
    expect(packs.fr.vsBotola2Body).toMatch(/Botola 2/);
    expect(packs.fr.vsBotola2Body).toMatch(/Botola Pro/);
    expect(packs.ar.vsBotola2Body).toMatch(/القسم الثاني/);
    expect(packs.fr.linkBotola2).toMatch(/Botola 2/);
  });

  it('does not ship odds UI copy or Elbotola nav terms', () => {
    for (const pack of Object.values(packs)) {
      const blob = Object.values(pack).join('\n');
      expect(blob).not.toMatch(ODDS_UI_RE);
      expect(blob).not.toMatch(ELBOTOLA_RE);
    }
  });
});
