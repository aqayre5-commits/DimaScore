import { describe, expect, it } from 'vitest';
import ar from '@/lib/i18n/messages/ar.json';
import en from '@/lib/i18n/messages/en.json';
import fr from '@/lib/i18n/messages/fr.json';
import { BOTOLA_COMPETITION_HUB } from '@/lib/seo/botola-season-opener';
import { botolaSeasonOpenerPath } from '@/lib/seo/botola-season-opener';
import {
  BOTOLA_CLASSEMENT_SLUGS,
  botolaClassementHreflang,
  botolaClassementPath,
  botolaClassementTableHash,
  botolaClassementTableHashAliases,
  botolaProCompetitionHreflang,
  botolaProCompetitionMetaDescription,
  botolaProCompetitionPageTitle,
  isBotolaClassementSlug,
  rewriteBotolaClassementPath,
} from '@/lib/seo/botola-classement';
import { translateStandingZoneLabel } from '@/lib/standings/zone-labels';
import { matchTabByHash } from '@/lib/ui/tab-hash';

const ODDS_UI_RE = /\b(odds|cotes?)\b.*\b(bookmaker|pari|betting)\b/i;
const EN_STANDINGS_META_RE = /\bstandings\b/i;

describe('botola classement routes (IMP-008)', () => {
  it('uses the canonical FR/EN/AR slugs', () => {
    expect(botolaClassementPath('fr')).toBe('/fr/classement-botola-pro');
    expect(botolaClassementPath('en')).toBe('/en/botola-pro-standings');
    expect(botolaClassementPath('ar')).toBe('/ar/classement-botola-pro');
  });

  it('keeps the AR path on a Latin slug', () => {
    expect(BOTOLA_CLASSEMENT_SLUGS.ar).toBe(BOTOLA_CLASSEMENT_SLUGS.fr);
    expect(BOTOLA_CLASSEMENT_SLUGS.ar).toMatch(/^[a-z0-9-]+$/);
  });

  it('maps hreflang with x-default to FR', () => {
    const languages = botolaClassementHreflang('https://dimascore.ma');
    expect(languages.fr).toBe('https://dimascore.ma/fr/classement-botola-pro');
    expect(languages.en).toBe('https://dimascore.ma/en/botola-pro-standings');
    expect(languages.ar).toBe('https://dimascore.ma/ar/classement-botola-pro');
    expect(languages['x-default']).toBe(languages.fr);
  });

  it('rewrites language-switcher paths to the locale canonical', () => {
    expect(rewriteBotolaClassementPath('/fr/classement-botola-pro', 'en')).toBe(
      '/en/botola-pro-standings',
    );
    expect(rewriteBotolaClassementPath('/en/botola-pro-standings', 'ar')).toBe(
      '/ar/classement-botola-pro',
    );
    expect(rewriteBotolaClassementPath('/ar/classement-botola-pro', 'fr')).toBe(
      '/fr/classement-botola-pro',
    );
    expect(isBotolaClassementSlug('classement-botola-pro')).toBe(true);
    expect(rewriteBotolaClassementPath('/fr/lions-abroad', 'en')).toBeNull();
  });
});

describe('botola classement deep-link hashes (LANG-006)', () => {
  it('uses locale standings hashes, not #standings alone on FR/AR', () => {
    expect(botolaClassementTableHash('fr')).toBe('classement');
    expect(botolaClassementTableHash('ar')).toBe('الترتيب');
    expect(botolaClassementTableHash('en')).toBe('standings');
    expect(botolaClassementTableHashAliases('fr')).toEqual(['standings']);
    expect(botolaClassementTableHashAliases('ar')).toEqual(['standings']);
    expect(botolaClassementTableHashAliases('en')).toEqual([]);
  });

  it('accepts #standings as an alias on FR/AR competition tabs', () => {
    const frTabs = [
      { key: 'standings', hash: 'classement', hashAliases: ['standings'] },
      { key: 'fixtures', hash: 'matchs' },
    ];
    expect(matchTabByHash(frTabs, 'classement')?.key).toBe('standings');
    expect(matchTabByHash(frTabs, 'standings')?.key).toBe('standings');
    expect(matchTabByHash(frTabs, 'matchs')?.key).toBe('fixtures');
  });
});

describe('botola classement hubs', () => {
  it('cross-links calendrier landings and competition SoT, not a second hub', () => {
    expect(BOTOLA_COMPETITION_HUB.fr).toBe('/fr/competition/maroc/botola-pro');
    expect(BOTOLA_COMPETITION_HUB.en).toBe('/en/competition/morocco/botola-pro');
    expect(BOTOLA_COMPETITION_HUB.ar).toBe('/ar/competition/maroc/botola-pro');
    expect(botolaSeasonOpenerPath('fr')).toBe('/fr/calendrier-botola-pro-2026-2027');
    expect(botolaSeasonOpenerPath('en')).toBe('/en/botola-pro-2026-27-calendar');
    expect(botolaSeasonOpenerPath('ar')).toBe('/ar/calendrier-botola-pro-2026-2027');
  });
});

describe('botola classement copy (LANG-022)', () => {
  const packs = {
    fr: fr.botolaClassement,
    en: en.botolaClassement,
    ar: ar.botolaClassement,
  };

  it('shares the same keys across FR/EN/AR', () => {
    const frKeys = Object.keys(packs.fr).sort();
    expect(Object.keys(packs.en).sort()).toEqual(frKeys);
    expect(Object.keys(packs.ar).sort()).toEqual(frKeys);
  });

  it('uses the locked meta titles and H1s', () => {
    expect(packs.fr.metaTitle).toBe('Classement Botola Pro 2026/27 en direct | DimaScore');
    expect(packs.en.metaTitle).toBe('Botola Pro standings live 2026/27 | DimaScore');
    expect(packs.ar.metaTitle).toBe('ترتيب البطولة الاحترافية مباشرة 2026/27 | ديماسكور');
    expect(packs.fr.h1).toBe('Classement Botola Pro 2026/27 en direct');
    expect(packs.en.h1).toBe('Botola Pro standings live 2026/27');
    expect(packs.ar.h1).toBe('ترتيب البطولة الاحترافية مباشرة 2026/27');
    expect(packs.fr.metaTitle.startsWith('Classement Botola')).toBe(true);
    expect(packs.en.metaTitle.startsWith('Botola Pro standings')).toBe(true);
    expect(packs.ar.metaTitle).toMatch(/ترتيب البطولة الاحترافية مباشرة/);
    expect(packs.ar.tableTitle).toMatch(/البطولة الاحترافية/);
  });

  it('does not ship FR/AR metas in English standings wording (LANG-019)', () => {
    expect(packs.fr.metaTitle).not.toMatch(EN_STANDINGS_META_RE);
    expect(packs.ar.metaTitle).not.toMatch(EN_STANDINGS_META_RE);
    expect(packs.fr.h1).not.toMatch(EN_STANDINGS_META_RE);
    expect(packs.ar.h1).not.toMatch(EN_STANDINGS_META_RE);
  });

  it('SSR lead answers live table + free/no betting and points date intent to calendrier', () => {
    expect(packs.fr.lead).toMatch(/classement live/i);
    expect(packs.fr.lead).toMatch(/sans paris|sans cotes/i);
    expect(packs.fr.lead).toMatch(/calendrier/);
    expect(packs.ar.lead).toMatch(/ترتيب/);
    expect(packs.ar.lead).toMatch(/برنامج/);
    expect(packs.fr.ctaCalendar).toMatch(/[Cc]alendrier/);
    expect(packs.ar.ctaCalendar).toMatch(/برنامج/);
  });

  it('teaches 16 clubs / 30 matchdays and keeps CAF/relegation as product footnotes', () => {
    expect(packs.fr.howToReadBody).toMatch(/16 clubs/);
    expect(packs.fr.howToReadBody).toMatch(/30 journées/);
    expect(packs.ar.howToReadBody).toMatch(/16/);
    expect(packs.ar.howToReadBody).toMatch(/30/);
    expect(packs.fr.howToReadBody).toMatch(/notes sous le tableau/);
    expect(packs.fr.howToReadBody).not.toMatch(/se qualifient pour/);
  });

  it('does not ship odds UI copy', () => {
    for (const pack of Object.values(packs)) {
      expect(Object.values(pack).join('\n')).not.toMatch(ODDS_UI_RE);
    }
  });
});

describe('botola pro competition hub meta', () => {
  it('uses locale-correct matchs/classement/stats titles with product season', () => {
    expect(botolaProCompetitionPageTitle('fr', null)).toBe(
      'Botola Pro — matchs, classement et stats | DimaScore',
    );
    expect(botolaProCompetitionPageTitle('fr', '2026/27')).toBe(
      'Botola Pro 2026/27 — matchs, classement et stats | DimaScore',
    );
    expect(botolaProCompetitionPageTitle('en', '2026/27')).toBe(
      'Botola Pro 2026/27 — matches, standings and stats | DimaScore',
    );
    expect(botolaProCompetitionPageTitle('ar', '2026/27')).toBe(
      'البطولة الاحترافية 2026/27 — المباريات والترتيب والإحصائيات | ديماسكور',
    );
  });

  it('does not put EN standings wording on FR/AR hub descriptions', () => {
    expect(botolaProCompetitionMetaDescription('fr', 'Botola Pro 2026/27')).not.toMatch(
      EN_STANDINGS_META_RE,
    );
    expect(botolaProCompetitionMetaDescription('ar', 'البطولة الاحترافية 2026/27')).not.toMatch(
      EN_STANDINGS_META_RE,
    );
    expect(botolaProCompetitionMetaDescription('en', 'Botola Pro 2026/27')).toMatch(
      EN_STANDINGS_META_RE,
    );
  });

  it('self-canonicalises the Latin hub URLs (IMP-012)', () => {
    const languages = botolaProCompetitionHreflang('https://dimascore.ma');
    expect(languages.fr).toBe('https://dimascore.ma/fr/competition/maroc/botola-pro');
    expect(languages.en).toBe('https://dimascore.ma/en/competition/morocco/botola-pro');
    expect(languages.ar).toBe('https://dimascore.ma/ar/competition/maroc/botola-pro');
    expect(languages['x-default']).toBe(languages.fr);
    expect(languages.ar).not.toMatch(/%|البطولة/);
  });
});

describe('standings zone footnotes (LANG-020)', () => {
  const cafCl = 'Promotion - CAF Champions League (Qualification)';
  const cafConfed = 'Promotion - CAF Confederation Cup (Qualification)';

  it('translates CAF Champions League qualification footnotes', () => {
    expect(translateStandingZoneLabel(cafCl, 'en')).toBe(
      'Promotion - CAF Champions League (Qualification)',
    );
    expect(translateStandingZoneLabel(cafCl, 'fr')).toBe(
      'Promotion - Ligue des champions CAF (qualification)',
    );
    expect(translateStandingZoneLabel(cafCl, 'ar')).toBe('تأهل - دوري أبطال أفريقيا (تصفيات)');
  });

  it('translates CAF Confederation Cup qualification footnotes', () => {
    expect(translateStandingZoneLabel(cafConfed, 'en')).toBe(
      'Promotion - CAF Confederation Cup (Qualification)',
    );
    expect(translateStandingZoneLabel(cafConfed, 'fr')).toBe(
      'Promotion - Coupe de la confédération CAF (qualification)',
    );
    expect(translateStandingZoneLabel(cafConfed, 'ar')).toBe(
      'تأهل - كأس الكونفدرالية الأفريقية (تصفيات)',
    );
  });

  it('passes unknown descriptions through unchanged', () => {
    expect(translateStandingZoneLabel('Relegation', 'fr')).toBe('Relegation');
    expect(translateStandingZoneLabel(null, 'ar')).toBeNull();
  });
});
