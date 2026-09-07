import { describe, expect, it } from 'vitest';
import ar from '@/lib/i18n/messages/ar.json';
import en from '@/lib/i18n/messages/en.json';
import fr from '@/lib/i18n/messages/fr.json';
import { BOTOLA_COMPETITION_HUB } from '@/lib/seo/botola-season-opener';
import { botolaClassementPath, isBotolaClassementSlug } from '@/lib/seo/botola-classement';
import {
  BOTOLA_2_CLASSEMENT_SLUGS,
  BOTOLA_2_COMPETITION_HUB,
  BOTOLA_2_COMPETITION_ID,
  botola2ClassementHreflang,
  botola2ClassementPath,
  botola2ClassementTableHash,
  botola2ClassementTableHashAliases,
  botola2CompetitionFixturesHref,
  botola2CompetitionMetaDescription,
  botola2CompetitionPageTitle,
  botola2CompetitionStandingsHref,
  isBotola2ClassementSlug,
  rewriteBotola2ClassementPath,
} from '@/lib/seo/botola-2-classement';
import { translateStandingZoneLabel } from '@/lib/standings/zone-labels';

const ODDS_UI_RE = /\b(odds|cotes?)\b.*\b(bookmaker|pari|betting)\b/i;
const EN_STANDINGS_META_RE = /\bstandings\b/i;
const INVENTED_RULES_RE = /barrage|se qualifient pour|automatic promotion|يصعد أول ناديين/i;

describe('botola 2 classement routes', () => {
  it('uses the canonical FR/EN/AR slugs', () => {
    expect(botola2ClassementPath('fr')).toBe('/fr/classement-botola-2');
    expect(botola2ClassementPath('en')).toBe('/en/botola-2-standings');
    expect(botola2ClassementPath('ar')).toBe('/ar/classement-botola-2');
  });

  it('keeps the AR path on a Latin slug', () => {
    expect(BOTOLA_2_CLASSEMENT_SLUGS.ar).toBe(BOTOLA_2_CLASSEMENT_SLUGS.fr);
    expect(BOTOLA_2_CLASSEMENT_SLUGS.ar).toMatch(/^[a-z0-9-]+$/);
  });

  it('does not collide with Pro classement slugs', () => {
    expect(isBotola2ClassementSlug('classement-botola-pro')).toBe(false);
    expect(isBotola2ClassementSlug('botola-pro-standings')).toBe(false);
    expect(isBotolaClassementSlug('classement-botola-2')).toBe(false);
    expect(isBotolaClassementSlug('botola-2-standings')).toBe(false);
    expect(botola2ClassementPath('fr')).not.toBe(botolaClassementPath('fr'));
    expect(BOTOLA_2_COMPETITION_ID).toBe(201);
  });

  it('maps hreflang with x-default to FR', () => {
    const languages = botola2ClassementHreflang('https://dimascore.ma');
    expect(languages.fr).toBe('https://dimascore.ma/fr/classement-botola-2');
    expect(languages.en).toBe('https://dimascore.ma/en/botola-2-standings');
    expect(languages.ar).toBe('https://dimascore.ma/ar/classement-botola-2');
    expect(languages['x-default']).toBe(languages.fr);
  });

  it('rewrites language-switcher paths to the locale canonical', () => {
    expect(rewriteBotola2ClassementPath('/fr/classement-botola-2', 'en')).toBe(
      '/en/botola-2-standings',
    );
    expect(rewriteBotola2ClassementPath('/en/botola-2-standings', 'ar')).toBe(
      '/ar/classement-botola-2',
    );
    expect(rewriteBotola2ClassementPath('/ar/classement-botola-2', 'fr')).toBe(
      '/fr/classement-botola-2',
    );
    expect(isBotola2ClassementSlug('classement-botola-2')).toBe(true);
    expect(rewriteBotola2ClassementPath('/fr/classement-botola-pro', 'en')).toBeNull();
    expect(rewriteBotola2ClassementPath('/fr/lions-abroad', 'en')).toBeNull();
  });
});

describe('botola 2 classement deep-link hashes', () => {
  it('reuses locale standings hashes and the #standings alias', () => {
    expect(botola2ClassementTableHash('fr')).toBe('classement');
    expect(botola2ClassementTableHash('ar')).toBe('الترتيب');
    expect(botola2ClassementTableHash('en')).toBe('standings');
    expect(botola2ClassementTableHashAliases('fr')).toEqual(['standings']);
    expect(botola2ClassementTableHashAliases('ar')).toEqual(['standings']);
    expect(botola2ClassementTableHashAliases('en')).toEqual([]);
  });
});

describe('botola 2 classement hubs', () => {
  it('points Matchs/Classement at Botola 2 SoT and see-also at Pro only', () => {
    expect(BOTOLA_2_COMPETITION_HUB.fr).toBe('/fr/competition/maroc/botola-2');
    expect(BOTOLA_2_COMPETITION_HUB.en).toBe('/en/competition/morocco/botola-2');
    expect(BOTOLA_2_COMPETITION_HUB.ar).toBe('/ar/competition/maroc/botola-2');
    expect(botola2CompetitionFixturesHref('fr')).toBe('/fr/competition/maroc/botola-2#matchs');
    expect(botola2CompetitionStandingsHref('en')).toBe(
      '/en/competition/morocco/botola-2#standings',
    );
    expect(botola2CompetitionFixturesHref('ar')).toBe('/ar/competition/maroc/botola-2#المباريات');
    expect(BOTOLA_COMPETITION_HUB.fr).toBe('/fr/competition/maroc/botola-pro');
    expect(botolaClassementPath('fr')).toBe('/fr/classement-botola-pro');
  });
});

describe('botola 2 classement copy (LANG-023)', () => {
  const packs = {
    fr: fr.botola2Classement,
    en: en.botola2Classement,
    ar: ar.botola2Classement,
  };

  it('shares the same keys across FR/EN/AR', () => {
    const frKeys = Object.keys(packs.fr).sort();
    expect(Object.keys(packs.en).sort()).toEqual(frKeys);
    expect(Object.keys(packs.ar).sort()).toEqual(frKeys);
  });

  it('uses the locked meta titles and H1s', () => {
    expect(packs.fr.metaTitle).toBe('Classement Botola 2 en direct | DimaScore');
    expect(packs.ar.metaTitle).toBe('ترتيب القسم الثاني مباشرة | ديماسكور');
    expect(packs.en.metaTitle).toBe('Botola 2 standings live | DimaScore');
    expect(packs.fr.h1).toBe('Classement Botola 2 en direct');
    expect(packs.ar.h1).toBe('ترتيب القسم الثاني مباشرة');
    expect(packs.en.h1).toBe('Botola 2 standings live');
  });

  it('does not ship FR/AR metas in English standings wording (LANG-019)', () => {
    expect(packs.fr.metaTitle).not.toMatch(EN_STANDINGS_META_RE);
    expect(packs.ar.metaTitle).not.toMatch(EN_STANDINGS_META_RE);
    expect(packs.fr.h1).not.toMatch(EN_STANDINGS_META_RE);
    expect(packs.ar.h1).not.toMatch(EN_STANDINGS_META_RE);
    expect(packs.fr.metaDescription).not.toMatch(EN_STANDINGS_META_RE);
  });

  it('SSR lead answers live table + free/no betting and Pro vs 2 distinction', () => {
    expect(packs.fr.lead).toMatch(/classement live/i);
    expect(packs.fr.lead).toMatch(/sans paris|sans cotes/i);
    expect(packs.fr.lead).toMatch(/Botola Pro/);
    expect(packs.ar.lead).toMatch(/ترتيب/);
    expect(packs.ar.lead).toMatch(/البطولة الاحترافية/);
    expect(packs.fr.ctaFixtures).toMatch(/[Mm]atchs/);
    expect(packs.ar.ctaFixtures).toMatch(/المباريات/);
  });

  it('does not invent a Botola 2 calendrier or 2026/27 season', () => {
    const all = Object.values(packs)
      .flatMap((p) => Object.values(p))
      .join('\n');
    expect(all).not.toMatch(/calendrier-botola-2/i);
    expect(all).not.toMatch(/2026\/27|2026\/2027/);
    expect(Object.keys(packs.fr)).not.toContain('ctaCalendar');
  });

  it('keeps promotion/relegation as product footnotes only', () => {
    expect(packs.fr.howToReadBody).toMatch(/notes sous le tableau/);
    expect(packs.fr.howToReadBody).not.toMatch(INVENTED_RULES_RE);
    expect(packs.ar.howToReadBody).not.toMatch(INVENTED_RULES_RE);
    expect(packs.fr.faq3a).toMatch(/n'invente pas/);
  });

  it('does not ship odds UI copy', () => {
    for (const pack of Object.values(packs)) {
      expect(Object.values(pack).join('\n')).not.toMatch(ODDS_UI_RE);
    }
  });
});

describe('botola 2 competition hub meta (LANG-023)', () => {
  it('uses locked FR/AR titles and appends the product season', () => {
    expect(botola2CompetitionPageTitle('fr', null)).toBe(
      'Botola 2 — classement, matchs et stats | DimaScore',
    );
    expect(botola2CompetitionPageTitle('fr', '2025/26')).toBe(
      'Botola 2 2025/26 — classement, matchs et stats | DimaScore',
    );
    expect(botola2CompetitionPageTitle('ar', null)).toBe(
      'القسم الثاني — الترتيب والمباريات والإحصائيات | ديماسكور',
    );
    expect(botola2CompetitionPageTitle('ar', '2025/26')).toBe(
      'القسم الثاني 2025/26 — الترتيب والمباريات والإحصائيات | ديماسكور',
    );
    expect(botola2CompetitionPageTitle('en', '2025/26')).toBeNull();
  });

  it('does not put EN standings wording on FR/AR hub descriptions', () => {
    expect(botola2CompetitionMetaDescription('fr', 'Botola 2 2025/26')).not.toMatch(
      EN_STANDINGS_META_RE,
    );
    expect(botola2CompetitionMetaDescription('ar', 'القسم الثاني 2025/26')).not.toMatch(
      EN_STANDINGS_META_RE,
    );
  });
});

describe('botola 2 standings zone footnotes (LANG-023)', () => {
  it('translates Promotion - Botola Pro footnotes', () => {
    expect(translateStandingZoneLabel('Promotion - Botola Pro', 'en')).toBe(
      'Promotion - Botola Pro',
    );
    expect(translateStandingZoneLabel('Promotion - Botola Pro', 'fr')).toBe(
      'Promotion - Botola Pro',
    );
    expect(translateStandingZoneLabel('Promotion - Botola Pro', 'ar')).toBe(
      'صعود - البطولة الاحترافية',
    );
  });

  it('translates Promotion - Botola Pro (Promotion) as accession, not invented barrage copy', () => {
    expect(translateStandingZoneLabel('Promotion - Botola Pro (Promotion)', 'en')).toBe(
      'Promotion - Botola Pro (Promotion)',
    );
    expect(translateStandingZoneLabel('Promotion - Botola Pro (Promotion)', 'fr')).toBe(
      'Promotion - Botola Pro (accession)',
    );
    expect(translateStandingZoneLabel('Promotion - Botola Pro (Promotion)', 'ar')).toBe(
      'صعود - البطولة الاحترافية (ملحق الصعود)',
    );
  });
});
