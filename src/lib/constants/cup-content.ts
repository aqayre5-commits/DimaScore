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

// ── WAFCON 2024 (competitionId: 922, season 2024 — played July 2025, completed) ──

const WAFCON_2024: CupContent = {
  meta: {
    fr: {
      title: 'CAN Féminine 2024 — Résultats, groupes et classement | Atlas Kings',
      description:
        'Résultats de la CAN Féminine 2024 au Maroc : 3 groupes, classement, phase à élimination directe. Nigeria vainqueur, Maroc finaliste.',
    },
    en: {
      title: 'WAFCON 2024 — Results, groups, standings and knockout | Atlas Kings',
      description:
        'WAFCON 2024 results from Morocco: 3 groups, standings, knockout bracket. Nigeria winners, Morocco runners-up.',
    },
    ar: {
      title: 'كأس أمم إفريقيا للسيدات 2024 — النتائج، المجموعات، الترتيب | أطلس كينغز',
      description:
        'نتائج كأس أمم إفريقيا للسيدات 2024 في المغرب: 3 مجموعات، الترتيب، الأدوار الإقصائية. نيجيريا البطلة، المغرب الوصيف.',
    },
  },
  intro: {
    fr: "La CAN Féminine 2024 s'est déroulée au Maroc du 5 au 26 juillet 2025. 12 équipes nationales se sont affrontées dans 3 groupes de 4, suivis d'une phase à élimination directe. Le Nigeria a remporté le titre en battant le Maroc 3-2 en finale.",
    en: 'WAFCON 2024 took place in Morocco from 5 to 26 July 2025. 12 national teams competed in 3 groups of 4, followed by a knockout phase. Nigeria won the title, beating Morocco 3-2 in the final.',
    ar: 'أقيمت بطولة كأس أمم إفريقيا للسيدات 2024 في المغرب من 5 إلى 26 يوليو 2025. تنافست 12 منتخباً وطنياً في 3 مجموعات من 4 فرق، تليها مرحلة إقصائية. فازت نيجيريا باللقب بفوزها على المغرب 3-2 في النهائي.',
  },
  titles: {
    fr: 'CAN Féminine 2024',
    en: 'WAFCON 2024',
    ar: 'كأس أمم إفريقيا للسيدات 2024',
  },
  slugs: ['can-feminine-2024', 'wafcon-2024', 'كأس-أمم-إفريقيا-للسيدات-2024'],
  urls: {
    fr: `${baseUrl}/fr/competition/caf/can-feminine-2024`,
    en: `${baseUrl}/en/competition/caf/wafcon-2024`,
    ar: `${baseUrl}/ar/competition/كاف/كأس-أمم-إفريقيا-للسيدات-2024`,
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
    fr: {
      ZA: 'Afrique du Sud',
      NG: 'Nigeria',
      GQ: 'Guinée équatoriale',
      CM: 'Cameroun',
      MA: 'Maroc',
    },
    en: {
      ZA: 'South Africa',
      NG: 'Nigeria',
      GQ: 'Equatorial Guinea',
      CM: 'Cameroon',
      MA: 'Morocco',
    },
    ar: {
      ZA: 'جنوب إفريقيا',
      NG: 'نيجيريا',
      GQ: 'غينيا الاستوائية',
      CM: 'الكاميرون',
      MA: 'المغرب',
    },
  },
  breadcrumbOrg: 'CAF',
};

// ── WAFCON 2026 (competitionId: 922 — upcoming, 25 Jul – 16 Aug 2026) ──

const WAFCON_2026: CupContent = {
  meta: {
    fr: {
      title: 'CAN Féminine 2026 — Calendrier, groupes et classement | Atlas Kings',
      description:
        'Suivez la CAN Féminine 2026 au Maroc : calendrier, 4 groupes, classement, phase à élimination directe. 16 équipes, format élargi.',
    },
    en: {
      title: 'WAFCON 2026 — Fixtures, groups, standings and results | Atlas Kings',
      description:
        'Follow WAFCON 2026 in Morocco: schedule, 4 groups, standings, knockout bracket. 16 teams, expanded format.',
    },
    ar: {
      title: 'كأس أمم إفريقيا للسيدات 2026 — الجدول، المجموعات، الترتيب والنتائج | أطلس كينغز',
      description:
        'تابعوا كأس أمم إفريقيا للسيدات 2026 في المغرب: الجدول، 4 مجموعات، الترتيب، الأدوار الإقصائية. 16 منتخباً، صيغة موسعة.',
    },
  },
  intro: {
    fr: 'La CAN Féminine 2026 (WAFCON) se déroulera au Maroc du 25 juillet au 16 août 2026. Première édition à 16 équipes (élargie de 12). Le Maroc, pays hôte, défendra ses couleurs après une finale perdue en 2024.',
    en: 'WAFCON 2026 takes place in Morocco from 25 July to 16 August 2026. The first edition with 16 teams (expanded from 12). Morocco, as hosts, will compete after reaching the 2024 final.',
    ar: 'تقام بطولة كأس أمم إفريقيا للسيدات 2026 في المغرب من 25 يوليو إلى 16 أغسطس 2026. أول نسخة بمشاركة 16 منتخباً (بدلاً من 12). المغرب، البلد المستضيف، سيشارك بعد وصوله لنهائي 2024.',
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
      '16 équipes nationales',
      '4 groupes de 4 équipes',
      'Pays hôte : Maroc',
      '25 juillet → 16 août 2026',
      'Format élargi : 1ère édition à 16 équipes',
      'Qualificatif pour la Coupe du Monde féminine 2027',
    ],
    en: [
      '16 national teams',
      '4 groups of 4 teams',
      'Host country: Morocco',
      '25 July → 16 August 2026',
      'Expanded format: first 16-team edition',
      "Qualifies for 2027 Women's World Cup",
    ],
    ar: [
      '16 منتخباً وطنياً',
      '4 مجموعات من 4 فرق',
      'البلد المستضيف: المغرب',
      '25 يوليو → 16 أغسطس 2026',
      'صيغة موسعة: أول نسخة بـ16 منتخباً',
      'مؤهلة لكأس العالم للسيدات 2027',
    ],
  },
  historicalTeamNames: {
    fr: {
      ZA: 'Afrique du Sud',
      NG: 'Nigeria',
      GQ: 'Guinée équatoriale',
      CM: 'Cameroun',
      MA: 'Maroc',
    },
    en: {
      ZA: 'South Africa',
      NG: 'Nigeria',
      GQ: 'Equatorial Guinea',
      CM: 'Cameroon',
      MA: 'Morocco',
    },
    ar: {
      ZA: 'جنوب إفريقيا',
      NG: 'نيجيريا',
      GQ: 'غينيا الاستوائية',
      CM: 'الكاميرون',
      MA: 'المغرب',
    },
  },
  breadcrumbOrg: 'CAF',
};

// ── Registry ──

/** Default (latest/upcoming) cup content per competition. */
const CUP_CONTENT_REGISTRY: Record<number, CupContent> = {
  1: WC_2026,
  922: WAFCON_2026,
};

/** Season-specific cup content: key = "competitionId:editionYear". */
const CUP_CONTENT_BY_SEASON: Record<string, CupContent> = {
  '1:2026': WC_2026,
  '922:2024': WAFCON_2024,
  '922:2026': WAFCON_2026,
};

/** All cup content entries (for slug lookups across all editions). */
const ALL_CUP_CONTENT: CupContent[] = [WC_2026, WAFCON_2024, WAFCON_2026];

/** Look up cup content by competitionId (returns latest/upcoming edition). */
export function getCupContent(competitionId: number): CupContent | undefined {
  return CUP_CONTENT_REGISTRY[competitionId];
}

/** Look up cup content for a specific edition year. */
export function getCupContentForSeason(
  competitionId: number,
  editionYear: number,
): CupContent | undefined {
  return CUP_CONTENT_BY_SEASON[`${competitionId}:${editionYear}`];
}

/** Find cup content by matching any of its locale slugs. */
export function findCupContentBySlug(slug: string): CupContent | undefined {
  for (const content of ALL_CUP_CONTENT) {
    if (content.slugs.includes(slug)) return content;
  }
  return undefined;
}

/** Find the edition year for a slug within a specific competition. */
export function findEditionYearBySlug(competitionId: number, slug: string): number | undefined {
  for (const [key, content] of Object.entries(CUP_CONTENT_BY_SEASON)) {
    if (key.startsWith(`${competitionId}:`) && content.slugs.includes(slug)) {
      return Number(key.split(':')[1]);
    }
  }
  return undefined;
}
