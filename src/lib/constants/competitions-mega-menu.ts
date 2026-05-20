import type { Locale } from '@/lib/i18n/config';

export interface MegaMenuEntry {
  competitionId: number;
  labelKey: string;
  countryKey: string;
  slugs: Record<Locale, string>;
  isPermanentAnchor?: boolean;
  isCurrentlyVisible: boolean;
}

export interface MegaMenuSection {
  titleKey: string;
  entries: MegaMenuEntry[];
}

/**
 * Mega-menu data for the Topbar "Competitions" dropdown.
 * Hardcoded per user decision (Q3). Grouped into 4 columns matching
 * homepage.md Section 2 layout.
 */
export const MEGA_MENU_SECTIONS: MegaMenuSection[] = [
  {
    titleKey: 'morocco',
    entries: [
      {
        competitionId: 200,
        labelKey: 'botolaPro',
        countryKey: 'maroc',
        slugs: {
          fr: 'botola-pro',
          en: 'botola-pro',
          ar: 'البطولة-الاحترافية',
        },
        isPermanentAnchor: true,
        isCurrentlyVisible: true,
      },
      {
        competitionId: 201,
        labelKey: 'botola2',
        countryKey: 'maroc',
        slugs: {
          fr: 'botola-2',
          en: 'botola-2',
          ar: 'بطولة-القسم-الثاني',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 822,
        labelKey: 'coupeDuTrone',
        countryKey: 'maroc',
        slugs: {
          fr: 'coupe-du-trone',
          en: 'coupe-du-trone',
          ar: 'كأس-العرش',
        },
        isCurrentlyVisible: true,
      },
    ],
  },
  {
    titleKey: 'international',
    entries: [
      {
        competitionId: 1,
        labelKey: 'worldCup2026',
        countryKey: 'fifa',
        slugs: {
          fr: 'coupe-du-monde-2026',
          en: 'world-cup-2026',
          ar: 'كأس-العالم-2026',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 29,
        labelKey: 'wcQualAfrica',
        countryKey: 'fifa',
        slugs: {
          fr: 'qualifications-cm-afrique',
          en: 'wc-qualifiers-africa',
          ar: 'تصفيات-كأس-العالم-أفريقيا',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 32,
        labelKey: 'wcQualEurope',
        countryKey: 'fifa',
        slugs: {
          fr: 'qualifications-cm-europe',
          en: 'wc-qualifiers-europe',
          ar: 'تصفيات-كأس-العالم-أوروبا',
        },
        isCurrentlyVisible: false,
      },
      {
        competitionId: 31,
        labelKey: 'wcQualConcacaf',
        countryKey: 'fifa',
        slugs: {
          fr: 'qualifications-cm-concacaf',
          en: 'wc-qualifiers-concacaf',
          ar: 'تصفيات-كأس-العالم-كونكاكاف',
        },
        isCurrentlyVisible: false,
      },
      {
        competitionId: 34,
        labelKey: 'wcQualSouthAmerica',
        countryKey: 'fifa',
        slugs: {
          fr: 'qualifications-cm-amerique-du-sud',
          en: 'wc-qualifiers-south-america',
          ar: 'تصفيات-كأس-العالم-أمريكا-الجنوبية',
        },
        isCurrentlyVisible: false,
      },
      {
        competitionId: 30,
        labelKey: 'wcQualAsia',
        countryKey: 'fifa',
        slugs: {
          fr: 'qualifications-cm-asie',
          en: 'wc-qualifiers-asia',
          ar: 'تصفيات-كأس-العالم-آسيا',
        },
        isCurrentlyVisible: false,
      },
      {
        competitionId: 33,
        labelKey: 'wcQualOceania',
        countryKey: 'fifa',
        slugs: {
          fr: 'qualifications-cm-oceanie',
          en: 'wc-qualifiers-oceania',
          ar: 'تصفيات-كأس-العالم-أوقيانوسيا',
        },
        isCurrentlyVisible: false,
      },
      {
        competitionId: 37,
        labelKey: 'wcQualIntercontinental',
        countryKey: 'fifa',
        slugs: {
          fr: 'qualifications-cm-intercontinental',
          en: 'wc-qualifiers-intercontinental',
          ar: 'تصفيات-كأس-العالم-القارية',
        },
        isCurrentlyVisible: false,
      },
      {
        competitionId: 307,
        labelKey: 'saudiProLeague',
        countryKey: 'arabie-saoudite',
        slugs: {
          fr: 'saudi-pro-league',
          en: 'saudi-pro-league',
          ar: 'دوري-المحترفين-السعودي',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 233,
        labelKey: 'egyptPremierLeague',
        countryKey: 'egypte',
        slugs: {
          fr: 'premier-league-egypte',
          en: 'egyptian-premier-league',
          ar: 'الدوري-المصري-الممتاز',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 186,
        labelKey: 'algeriaLigue1',
        countryKey: 'algerie',
        slugs: {
          fr: 'ligue-1-algerie',
          en: 'algeria-ligue-1',
          ar: 'الدوري-الجزائري',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 202,
        labelKey: 'tunisiaLigue1',
        countryKey: 'tunisie',
        slugs: {
          fr: 'ligue-1-tunisie',
          en: 'tunisia-ligue-1',
          ar: 'الدوري-التونسي',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 301,
        labelKey: 'uaeProLeague',
        countryKey: 'emirats',
        slugs: {
          fr: 'uae-pro-league',
          en: 'uae-pro-league',
          ar: 'دوري-المحترفين-الإماراتي',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 203,
        labelKey: 'superLig',
        countryKey: 'turquie',
        slugs: {
          fr: 'super-lig',
          en: 'super-lig',
          ar: 'الدوري-التركي',
        },
        isCurrentlyVisible: true,
      },
    ],
  },
  {
    titleKey: 'africa',
    entries: [
      {
        competitionId: 6,
        labelKey: 'afcon',
        countryKey: 'caf',
        slugs: {
          fr: 'can-2027',
          en: 'afcon-2027',
          ar: 'كأس-أمم-إفريقيا-2027',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 36,
        labelKey: 'afconQualifiers',
        countryKey: 'caf',
        slugs: {
          fr: 'qualifications-can',
          en: 'afcon-qualifiers',
          ar: 'تصفيات-كأس-أمم-إفريقيا',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 922,
        labelKey: 'wafcon2024',
        countryKey: 'caf',
        slugs: {
          fr: 'can-feminine-2024',
          en: 'wafcon-2024',
          ar: 'كأس-أمم-إفريقيا-للسيدات-2024',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 922,
        labelKey: 'wafcon2026',
        countryKey: 'caf',
        slugs: {
          fr: 'can-feminine-2026',
          en: 'wafcon-2026',
          ar: 'كأس-أمم-إفريقيا-للسيدات-2026',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 12,
        labelKey: 'cafChampionsLeague',
        countryKey: 'caf',
        slugs: {
          fr: 'ligue-des-champions-caf',
          en: 'caf-champions-league',
          ar: 'دوري-أبطال-أفريقيا',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 20,
        labelKey: 'cafConfederationCup',
        countryKey: 'caf',
        slugs: {
          fr: 'coupe-confederation-caf',
          en: 'caf-confederation-cup',
          ar: 'كأس-الكونفدرالية-الأفريقية',
        },
        isCurrentlyVisible: true,
      },
    ],
  },
  {
    titleKey: 'europe',
    entries: [
      {
        competitionId: 39,
        labelKey: 'premierLeague',
        countryKey: 'angleterre',
        slugs: {
          fr: 'premier-league',
          en: 'premier-league',
          ar: 'الدوري-الإنجليزي-الممتاز',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 140,
        labelKey: 'laLiga',
        countryKey: 'espagne',
        slugs: { fr: 'la-liga', en: 'la-liga', ar: 'الدوري-الإسباني' },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 78,
        labelKey: 'bundesliga',
        countryKey: 'allemagne',
        slugs: {
          fr: 'bundesliga',
          en: 'bundesliga',
          ar: 'الدوري-الألماني',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 135,
        labelKey: 'serieA',
        countryKey: 'italie',
        slugs: { fr: 'serie-a', en: 'serie-a', ar: 'الدوري-الإيطالي' },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 61,
        labelKey: 'ligue1',
        countryKey: 'france',
        slugs: { fr: 'ligue-1', en: 'ligue-1', ar: 'الدوري-الفرنسي' },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 2,
        labelKey: 'championsLeague',
        countryKey: 'uefa',
        slugs: {
          fr: 'ligue-des-champions',
          en: 'champions-league',
          ar: 'دوري-أبطال-أوروبا',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 3,
        labelKey: 'europaLeague',
        countryKey: 'uefa',
        slugs: {
          fr: 'ligue-europa',
          en: 'europa-league',
          ar: 'الدوري-الأوروبي',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 848,
        labelKey: 'conferenceLeague',
        countryKey: 'uefa',
        slugs: {
          fr: 'ligue-europa-conference',
          en: 'conference-league',
          ar: 'دوري-المؤتمر-الأوروبي',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 525,
        labelKey: 'uwcl',
        countryKey: 'uefa',
        slugs: {
          fr: 'ligue-des-champions-feminine',
          en: 'uwcl',
          ar: 'دوري-أبطال-أوروبا-للسيدات',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 1191,
        labelKey: 'uefaEuropaCupWomen',
        countryKey: 'uefa',
        slugs: {
          fr: 'coupe-europa-feminine',
          en: 'uefa-europa-cup-women',
          ar: 'كأس-أوروبا-للسيدات',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 44,
        labelKey: 'faWsl',
        countryKey: 'angleterre',
        slugs: {
          fr: 'fa-wsl',
          en: 'fa-wsl',
          ar: 'الدوري-الإنجليزي-للسيدات',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 82,
        labelKey: 'frauenBundesliga',
        countryKey: 'allemagne',
        slugs: {
          fr: 'frauen-bundesliga',
          en: 'frauen-bundesliga',
          ar: 'الدوري-الألماني-للسيدات',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 142,
        labelKey: 'ligaF',
        countryKey: 'espagne',
        slugs: {
          fr: 'liga-f',
          en: 'liga-f',
          ar: 'الدوري-الإسباني-للسيدات',
        },
        isCurrentlyVisible: true,
      },
      {
        competitionId: 139,
        labelKey: 'serieAWomen',
        countryKey: 'italie',
        slugs: {
          fr: 'serie-a-femminile',
          en: 'serie-a-women',
          ar: 'الدوري-الإيطالي-للسيدات',
        },
        isCurrentlyVisible: true,
      },
    ],
  },
];

/**
 * Look up a mega menu entry by competition ID. Returns null if not found.
 */
export function findEntryByCompetitionId(competitionId: number): MegaMenuEntry | null {
  for (const section of MEGA_MENU_SECTIONS) {
    for (const entry of section.entries) {
      if (entry.competitionId === competitionId) return entry;
    }
  }
  return null;
}

/**
 * Build a full competition URL for a given locale.
 * Pattern: /[locale]/competition/[country-slug]/[tournament-slug]
 */
export function buildCompetitionHref(entry: MegaMenuEntry, locale: Locale): string {
  const { countryKey, slugs } = entry;
  // Import inline to avoid circular deps — country-slugs is a leaf module
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getCountrySlug } = require('./country-slugs') as {
    getCountrySlug: (key: string, locale: Locale) => string;
  };
  const countrySlug = getCountrySlug(countryKey, locale);
  return `/${locale}/competition/${countrySlug}/${slugs[locale]}`;
}

/**
 * Featured slots for the Topbar. Returns the top 2 competitions by
 * Morocco-relevance priority that are currently visible.
 *
 * Hardcoded ranking for now (matches homepage.md Section 2 priority table).
 * Today (2026-05-20): WC 2026 (22 days to kickoff) + WAFCON 2026 (66 days).
 */
export function getFeaturedSlots(): MegaMenuEntry[] {
  const wc2026 = MEGA_MENU_SECTIONS.flatMap((s) => s.entries).find((e) => e.competitionId === 1);
  const wafcon2026 = MEGA_MENU_SECTIONS.flatMap((s) => s.entries).find(
    (e) => e.competitionId === 922 && e.labelKey === 'wafcon2026',
  );
  return [wc2026, wafcon2026].filter((e): e is MegaMenuEntry => e != null && e.isCurrentlyVisible);
}
