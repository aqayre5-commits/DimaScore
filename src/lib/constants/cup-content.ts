/**
 * Per-competition, per-locale content for cup pages.
 * Keyed by competitionId. Extracted from page.tsx to support multiple cups.
 */

import type { Locale } from '@/lib/i18n/config';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export interface CupContent {
  meta: Record<Locale, { title: string; description: string }>;
  intro: Record<Locale, string>;
  titles: Record<Locale, string>;
  slugs: string[];
  urls: Record<Locale, string>;
  tabHashes: Record<
    Locale,
    { overview: string; standings: string; bestThird: string; knockout: string }
  >;
  facts: Record<Locale, string[]>;
  historicalTeamNames: Record<Locale, Record<string, string>>;
  breadcrumbOrg: string;
}

// ── WC 2026 (competitionId: 1) ──

const WC_2026: CupContent = {
  meta: {
    fr: {
      title: 'Coupe du Monde 2026 — Calendrier, groupes, classement et phase finale | Atlas Kings',
      description:
        "Suivez la Coupe du Monde FIFA 2026 en direct : calendrier des 104 matchs, les 12 groupes, classement de chaque groupe, phase à élimination directe. Le Maroc dans le Groupe C avec le Brésil, Haïti et l'Écosse.",
    },
    en: {
      title: 'FIFA World Cup 2026 — Fixtures, groups, standings and knockout | Atlas Kings',
      description:
        'Follow the FIFA World Cup 2026 live: 104-match schedule, 12 groups, standings per group, knockout bracket. Morocco in Group C with Brazil, Haiti, and Scotland.',
    },
    ar: {
      title: 'كأس العالم 2026 — الجدول، المجموعات، الترتيب ومرحلة الإقصاء | أطلس كينغز',
      description:
        'تابعوا كأس العالم فيفا 2026 مباشرة: جدول 104 مباريات، 12 مجموعة، ترتيب كل مجموعة، الأدوار الإقصائية. المغرب في المجموعة C مع البرازيل وهايتي واسكتلندا.',
    },
  },
  intro: {
    fr: 'La Coupe du Monde FIFA 2026 réunit 48 équipes nationales aux États-Unis, au Canada et au Mexique — la première édition à 48 équipes au lieu de 32. Suivez le calendrier complet, les 12 groupes, les classements et la phase à élimination directe en direct.',
    en: 'The FIFA World Cup 2026 brings 48 national teams to the United States, Canada, and Mexico — the first edition with 48 teams instead of 32. Follow the full schedule, 12 groups, standings, and knockout bracket live.',
    ar: 'يجمع كأس العالم فيفا 2026 ثمانية وأربعين منتخباً وطنياً في الولايات المتحدة وكندا والمكسيك — أول نسخة بمشاركة 48 منتخباً بدلاً من 32. تابعوا الجدول الكامل، 12 مجموعة، الترتيب ومرحلة الأدوار الإقصائية مباشرة.',
  },
  titles: {
    fr: 'Coupe du Monde FIFA 2026',
    en: 'FIFA World Cup 2026',
    ar: 'كأس العالم فيفا 2026',
  },
  slugs: ['coupe-du-monde-2026', 'world-cup-2026', 'كأس-العالم-2026'],
  urls: {
    fr: `${baseUrl}/fr/competition/fifa/coupe-du-monde-2026`,
    en: `${baseUrl}/en/competition/fifa/world-cup-2026`,
    ar: `${baseUrl}/ar/competition/فيفا/كأس-العالم-2026`,
  },
  tabHashes: {
    fr: {
      overview: 'vue-densemble',
      standings: 'classement',
      bestThird: 'meilleurs-3emes',
      knockout: 'elimination',
    },
    en: {
      overview: 'overview',
      standings: 'standings',
      bestThird: 'best-3rd',
      knockout: 'knockout',
    },
    ar: {
      overview: 'نظرة-عامة',
      standings: 'ترتيب',
      bestThird: 'افضل-الثالثة',
      knockout: 'إقصائيات',
    },
  },
  facts: {
    fr: [
      '48 équipes nationales',
      '12 groupes de 4 équipes',
      '104 matchs au total',
      '16 villes hôtes',
      '3 pays organisateurs (USA, Canada, Mexique)',
      '11 juin → 19 juillet 2026',
      'Format élargi : 1ère édition à 48 équipes',
    ],
    en: [
      '48 national teams',
      '12 groups of 4 teams',
      '104 total matches',
      '16 host cities',
      '3 host countries (USA, Canada, Mexico)',
      '11 June → 19 July 2026',
      'Expanded format: first 48-team edition',
    ],
    ar: [
      '48 منتخباً وطنياً',
      '12 مجموعة من 4 فرق',
      '104 مباريات إجمالاً',
      '16 مدينة مستضيفة',
      '3 دول مستضيفة (الولايات المتحدة، كندا، المكسيك)',
      '11 يونيو → 19 يوليو 2026',
      'صيغة موسعة: أول نسخة بـ48 منتخباً',
    ],
  },
  historicalTeamNames: {
    fr: { AR: 'Argentine', FR: 'France', DE: 'Allemagne', ES: 'Espagne', IT: 'Italie' },
    en: { AR: 'Argentina', FR: 'France', DE: 'Germany', ES: 'Spain', IT: 'Italy' },
    ar: { AR: 'الأرجنتين', FR: 'فرنسا', DE: 'ألمانيا', ES: 'إسبانيا', IT: 'إيطاليا' },
  },
  breadcrumbOrg: 'FIFA',
};

// ── WAFCON 2026 (competitionId: 922) ──

const WAFCON_2026: CupContent = {
  meta: {
    fr: {
      title: 'CAN Féminine 2026 — Calendrier, groupes, classement et résultats | Atlas Kings',
      description:
        'Suivez la CAN Féminine 2026 au Maroc : calendrier, 3 groupes, classement, phase à élimination directe. Le Maroc pays hôte.',
    },
    en: {
      title: 'WAFCON 2026 — Fixtures, groups, standings and results | Atlas Kings',
      description:
        'Follow WAFCON 2026 in Morocco: schedule, 3 groups, standings, knockout bracket. Morocco as host nation.',
    },
    ar: {
      title: 'كأس أمم إفريقيا للسيدات 2026 — الجدول، المجموعات، الترتيب والنتائج | أطلس كينغز',
      description:
        'تابعوا كأس أمم إفريقيا للسيدات 2026 في المغرب: الجدول، 3 مجموعات، الترتيب، الأدوار الإقصائية. المغرب بلد مستضيف.',
    },
  },
  intro: {
    fr: "La Coupe d'Afrique des Nations Féminine 2026 (WAFCON) se déroule au Maroc. 12 équipes nationales s'affrontent dans 3 groupes de 4, suivis d'une phase à élimination directe. Suivez le calendrier complet, les classements et les résultats en direct.",
    en: "The Women's Africa Cup of Nations 2026 (WAFCON) takes place in Morocco. 12 national teams compete in 3 groups of 4, followed by a knockout phase. Follow the full schedule, standings, and live results.",
    ar: 'تقام بطولة كأس أمم إفريقيا للسيدات 2026 في المغرب. تتنافس 12 منتخباً وطنياً في 3 مجموعات من 4 فرق، تليها مرحلة إقصائية. تابعوا الجدول الكامل، الترتيب والنتائج مباشرة.',
  },
  titles: {
    fr: 'CAN Féminine 2026',
    en: 'WAFCON 2026',
    ar: 'كأس أمم إفريقيا للسيدات 2026',
  },
  slugs: ['can-feminine-2026', 'wafcon-2026', 'كأس-أمم-إفريقيا-للسيدات-2026'],
  urls: {
    fr: `${baseUrl}/fr/competition/caf/can-feminine-2026`,
    en: `${baseUrl}/en/competition/caf/wafcon-2026`,
    ar: `${baseUrl}/ar/competition/كاف/كأس-أمم-إفريقيا-للسيدات-2026`,
  },
  tabHashes: {
    fr: {
      overview: 'vue-densemble',
      standings: 'classement',
      bestThird: 'meilleurs-3emes',
      knockout: 'elimination',
    },
    en: {
      overview: 'overview',
      standings: 'standings',
      bestThird: 'best-3rd',
      knockout: 'knockout',
    },
    ar: {
      overview: 'نظرة-عامة',
      standings: 'ترتيب',
      bestThird: 'افضل-الثالثة',
      knockout: 'إقصائيات',
    },
  },
  facts: {
    fr: [
      '12 équipes nationales',
      '3 groupes de 4 équipes',
      '26 matchs au total',
      'Pays hôte : Maroc',
      '5 → 26 juillet 2025',
      'Vainqueur : Nigeria',
      'Finale : Maroc 2-3 Nigeria',
    ],
    en: [
      '12 national teams',
      '3 groups of 4 teams',
      '26 total matches',
      'Host country: Morocco',
      '5 → 26 July 2025',
      'Winner: Nigeria',
      'Final: Morocco 2-3 Nigeria',
    ],
    ar: [
      '12 منتخباً وطنياً',
      '3 مجموعات من 4 فرق',
      '26 مباراة إجمالاً',
      'البلد المستضيف: المغرب',
      '5 → 26 يوليو 2025',
      'الفائز: نيجيريا',
      'النهائي: المغرب 2-3 نيجيريا',
    ],
  },
  historicalTeamNames: {
    fr: { ZA: 'Afrique du Sud', NG: 'Nigeria', GQ: 'Guinée équatoriale', CM: 'Cameroun' },
    en: { ZA: 'South Africa', NG: 'Nigeria', GQ: 'Equatorial Guinea', CM: 'Cameroon' },
    ar: { ZA: 'جنوب إفريقيا', NG: 'نيجيريا', GQ: 'غينيا الاستوائية', CM: 'الكاميرون' },
  },
  breadcrumbOrg: 'CAF',
};

// ── Registry ──

const CUP_CONTENT_REGISTRY: Record<number, CupContent> = {
  1: WC_2026,
  922: WAFCON_2026,
};

/** Look up cup content by competitionId. */
export function getCupContent(competitionId: number): CupContent | undefined {
  return CUP_CONTENT_REGISTRY[competitionId];
}

/** Find cup content by matching any of its locale slugs. */
export function findCupContentBySlug(slug: string): CupContent | undefined {
  for (const content of Object.values(CUP_CONTENT_REGISTRY)) {
    if (content.slugs.includes(slug)) return content;
  }
  return undefined;
}
