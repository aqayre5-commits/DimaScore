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

// ---------------------------------------------------------------------------
// All competition entries (flat registry)
// ---------------------------------------------------------------------------

const ALL_ENTRIES: MegaMenuEntry[] = [
  // Morocco
  {
    competitionId: 200,
    labelKey: 'botolaPro',
    countryKey: 'maroc',
    slugs: { fr: 'botola-pro', en: 'botola-pro', ar: 'البطولة-الاحترافية' },
    isPermanentAnchor: true,
    isCurrentlyVisible: true,
  },
  {
    competitionId: 201,
    labelKey: 'botola2',
    countryKey: 'maroc',
    slugs: { fr: 'botola-2', en: 'botola-2', ar: 'بطولة-القسم-الثاني' },
    isCurrentlyVisible: true,
  },
  {
    competitionId: 822,
    labelKey: 'coupeDuTrone',
    countryKey: 'maroc',
    slugs: { fr: 'coupe-du-trone', en: 'coupe-du-trone', ar: 'كأس-العرش' },
    isCurrentlyVisible: true,
  },

  // FIFA
  {
    competitionId: 1,
    labelKey: 'worldCup2026',
    countryKey: 'fifa',
    slugs: { fr: 'coupe-du-monde-2026', en: 'world-cup-2026', ar: 'كأس-العالم-2026' },
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
    slugs: { fr: 'qualifications-cm-asie', en: 'wc-qualifiers-asia', ar: 'تصفيات-كأس-العالم-آسيا' },
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

  // Africa
  {
    competitionId: 6,
    labelKey: 'afcon',
    countryKey: 'caf',
    slugs: { fr: 'can-2025', en: 'afcon-2025', ar: 'كأس-أمم-إفريقيا-2025' },
    isCurrentlyVisible: true,
  },
  {
    competitionId: 36,
    labelKey: 'afconQualifiers',
    countryKey: 'caf',
    slugs: { fr: 'qualifications-can', en: 'afcon-qualifiers', ar: 'تصفيات-كأس-أمم-إفريقيا' },
    isCurrentlyVisible: true,
  },
  {
    competitionId: 922,
    labelKey: 'wafcon2024',
    countryKey: 'caf',
    slugs: { fr: 'can-feminine-2024', en: 'wafcon-2024', ar: 'كأس-أمم-إفريقيا-للسيدات-2024' },
    isCurrentlyVisible: true,
  },
  {
    competitionId: 922,
    labelKey: 'wafcon2026',
    countryKey: 'caf',
    slugs: { fr: 'can-feminine-2026', en: 'wafcon-2026', ar: 'كأس-أمم-إفريقيا-للسيدات-2026' },
    isCurrentlyVisible: true,
  },
  {
    competitionId: 12,
    labelKey: 'cafChampionsLeague',
    countryKey: 'caf',
    slugs: { fr: 'ligue-des-champions-caf', en: 'caf-champions-league', ar: 'دوري-أبطال-أفريقيا' },
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

  // Europe — top 5 leagues
  {
    competitionId: 39,
    labelKey: 'premierLeague',
    countryKey: 'angleterre',
    slugs: { fr: 'premier-league', en: 'premier-league', ar: 'الدوري-الإنجليزي-الممتاز' },
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
    slugs: { fr: 'bundesliga', en: 'bundesliga', ar: 'الدوري-الألماني' },
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

  // Europe — UEFA cups
  {
    competitionId: 2,
    labelKey: 'championsLeague',
    countryKey: 'uefa',
    slugs: { fr: 'ligue-des-champions', en: 'champions-league', ar: 'دوري-أبطال-أوروبا' },
    isCurrentlyVisible: true,
  },
  {
    competitionId: 3,
    labelKey: 'europaLeague',
    countryKey: 'uefa',
    slugs: { fr: 'ligue-europa', en: 'europa-league', ar: 'الدوري-الأوروبي' },
    isCurrentlyVisible: true,
  },
  {
    competitionId: 848,
    labelKey: 'conferenceLeague',
    countryKey: 'uefa',
    slugs: { fr: 'ligue-europa-conference', en: 'conference-league', ar: 'دوري-المؤتمر-الأوروبي' },
    isCurrentlyVisible: true,
  },

  // Europe — women's
  {
    competitionId: 525,
    labelKey: 'uwcl',
    countryKey: 'uefa',
    slugs: { fr: 'ligue-des-champions-feminine', en: 'uwcl', ar: 'دوري-أبطال-أوروبا-للسيدات' },
    isCurrentlyVisible: true,
  },
  {
    competitionId: 1191,
    labelKey: 'uefaEuropaCupWomen',
    countryKey: 'uefa',
    slugs: { fr: 'coupe-europa-feminine', en: 'uefa-europa-cup-women', ar: 'كأس-أوروبا-للسيدات' },
    isCurrentlyVisible: true,
  },
  {
    competitionId: 44,
    labelKey: 'faWsl',
    countryKey: 'angleterre',
    slugs: { fr: 'fa-wsl', en: 'fa-wsl', ar: 'الدوري-الإنجليزي-للسيدات' },
    isCurrentlyVisible: true,
  },
  {
    competitionId: 82,
    labelKey: 'frauenBundesliga',
    countryKey: 'allemagne',
    slugs: { fr: 'frauen-bundesliga', en: 'frauen-bundesliga', ar: 'الدوري-الألماني-للسيدات' },
    isCurrentlyVisible: true,
  },
  {
    competitionId: 142,
    labelKey: 'ligaF',
    countryKey: 'espagne',
    slugs: { fr: 'liga-f', en: 'liga-f', ar: 'الدوري-الإسباني-للسيدات' },
    isCurrentlyVisible: true,
  },
  {
    competitionId: 139,
    labelKey: 'serieAWomen',
    countryKey: 'italie',
    slugs: { fr: 'serie-a-femminile', en: 'serie-a-women', ar: 'الدوري-الإيطالي-للسيدات' },
    isCurrentlyVisible: true,
  },

  // Arab & Turkish leagues
  {
    competitionId: 307,
    labelKey: 'saudiProLeague',
    countryKey: 'arabie-saoudite',
    slugs: { fr: 'saudi-pro-league', en: 'saudi-pro-league', ar: 'دوري-المحترفين-السعودي' },
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
    slugs: { fr: 'ligue-1-algerie', en: 'algeria-ligue-1', ar: 'الدوري-الجزائري' },
    isCurrentlyVisible: true,
  },
  {
    competitionId: 202,
    labelKey: 'tunisiaLigue1',
    countryKey: 'tunisie',
    slugs: { fr: 'ligue-1-tunisie', en: 'tunisia-ligue-1', ar: 'الدوري-التونسي' },
    isCurrentlyVisible: true,
  },
  {
    competitionId: 301,
    labelKey: 'uaeProLeague',
    countryKey: 'emirats',
    slugs: { fr: 'uae-pro-league', en: 'uae-pro-league', ar: 'دوري-المحترفين-الإماراتي' },
    isCurrentlyVisible: true,
  },
  {
    competitionId: 203,
    labelKey: 'superLig',
    countryKey: 'turquie',
    slugs: { fr: 'super-lig', en: 'super-lig', ar: 'الدوري-التركي' },
    isCurrentlyVisible: true,
  },
];

/** All competition entries — used for lookups across both top nav and "More" menu. */
export { ALL_ENTRIES };

// ---------------------------------------------------------------------------
// Top nav — 8 direct competition links shown in the navbar
// ---------------------------------------------------------------------------

/** Competition IDs shown as direct links in the top nav bar. The fr/ar default lead with
 *  Botola (Morocco-first frame for that audience); the EN variant leads with global
 *  competitions per the Option 1 neutrality policy. Underlying set is identical. */
const TOP_NAV_IDS_FR_AR = [200, 1, 6, 2, 39, 140, 61, 78, 135, 922, 12] as const;
const TOP_NAV_IDS_EN = [1, 6, 922, 12, 2, 39, 140, 78, 135, 61, 200] as const;

/** Locale-agnostic flat list — used for generateStaticParams and any caller that needs
 *  the set (not the order). Stable for ISR/route generation. */
export const TOP_NAV_COMPETITION_IDS = TOP_NAV_IDS_FR_AR;

/** Label keys for top nav items (used by Topbar to render short labels). */
const TOP_NAV_LABEL_KEYS: Record<number, string> = {
  200: 'botolaPro',
  1: 'worldCup2026',
  6: 'afcon',
  2: 'championsLeague',
  39: 'premierLeague',
  140: 'laLiga',
  61: 'ligue1',
  78: 'bundesliga',
  135: 'serieA',
  922: 'wafcon2026',
  12: 'cafChampionsLeague',
};

/** Returns the 11 top-nav entries in display order. Pass a locale to get the locale-aware
 *  ordering (EN = global-first, fr/ar = Morocco-first). Default keeps the legacy fr/ar order
 *  so callers that don't have a locale (e.g. server-static fallbacks) stay stable. */
export function getTopNavEntries(locale?: Locale): MegaMenuEntry[] {
  const ids = locale === 'en' ? TOP_NAV_IDS_EN : TOP_NAV_IDS_FR_AR;
  return ids.map((id) => {
    const labelKey = TOP_NAV_LABEL_KEYS[id];
    return ALL_ENTRIES.find((e) => e.competitionId === id && e.labelKey === labelKey)!;
  });
}

// ---------------------------------------------------------------------------
// "More" mega menu — remaining competitions grouped into 6 sections
// ---------------------------------------------------------------------------

const topNavSet = new Set<string>(
  TOP_NAV_COMPETITION_IDS.map((id) => `${id}:${TOP_NAV_LABEL_KEYS[id]}`),
);

function isTopNav(e: MegaMenuEntry): boolean {
  return topNavSet.has(`${e.competitionId}:${e.labelKey}`);
}

function entriesFor(labelKeys: string[]): MegaMenuEntry[] {
  const keySet = new Set(labelKeys);
  return ALL_ENTRIES.filter((e) => keySet.has(e.labelKey) && !isTopNav(e));
}

/**
 * Mega-menu sections for the "More" dropdown.
 * Excludes the 8 top-nav competitions. Grouped into 6 logical sections.
 *
 * The default order (fr/ar) leads with the Morocco section. EN consumers should call
 * {@link getMegaMenuSections}('en') to get the global-first reordering.
 */
export const MEGA_MENU_SECTIONS: MegaMenuSection[] = [
  {
    titleKey: 'morocco',
    entries: entriesFor(['botola2', 'coupeDuTrone']),
  },
  {
    titleKey: 'africa',
    entries: entriesFor([
      'afcon',
      'afconQualifiers',
      'wafcon2024',
      'cafChampionsLeague',
      'cafConfederationCup',
    ]),
  },
  {
    titleKey: 'wcQualifiers',
    entries: entriesFor([
      'wcQualAfrica',
      'wcQualEurope',
      'wcQualConcacaf',
      'wcQualSouthAmerica',
      'wcQualAsia',
      'wcQualOceania',
      'wcQualIntercontinental',
    ]),
  },
  {
    titleKey: 'europe',
    entries: entriesFor(['serieA', 'europaLeague', 'conferenceLeague']),
  },
  {
    titleKey: 'arabTurkish',
    entries: entriesFor([
      'saudiProLeague',
      'egyptPremierLeague',
      'algeriaLigue1',
      'tunisiaLigue1',
      'uaeProLeague',
      'superLig',
    ]),
  },
  {
    titleKey: 'womens',
    entries: entriesFor([
      'uwcl',
      'uefaEuropaCupWomen',
      'faWsl',
      'frauenBundesliga',
      'ligaF',
      'serieAWomen',
    ]),
  },
];

/** Locale-aware mega-menu section ordering. EN sinks the Morocco section below the
 *  global-relevance sections (africa, wcQualifiers, europe, arabTurkish, morocco, womens);
 *  fr/ar keep the default Morocco-first ordering. */
export function getMegaMenuSections(locale: Locale): MegaMenuSection[] {
  if (locale !== 'en') return MEGA_MENU_SECTIONS;
  const byTitle = new Map(MEGA_MENU_SECTIONS.map((s) => [s.titleKey, s]));
  const order = ['africa', 'wcQualifiers', 'europe', 'arabTurkish', 'morocco', 'womens'];
  return order.map((k) => byTitle.get(k)!).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/**
 * Look up a mega menu entry by competition ID. Returns null if not found.
 */
export function findEntryByCompetitionId(competitionId: number): MegaMenuEntry | null {
  return ALL_ENTRIES.find((e) => e.competitionId === competitionId) ?? null;
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
 * Build a competition URL from a competition id, or return null when the competition isn't in
 * ALL_ENTRIES (i.e. has no real page). Link sites that only hold a DB id should use this so links
 * always resolve to the canonical localized URL — never a raw DB slug that lands on a 404.
 */
export function buildCompetitionHrefById(competitionId: number, locale: Locale): string | null {
  const entry = findEntryByCompetitionId(competitionId);
  return entry ? buildCompetitionHref(entry, locale) : null;
}

// ---------------------------------------------------------------------------
// Competition families — related competitions shown at bottom of pages
// ---------------------------------------------------------------------------

/**
 * Maps a competition ID to its sibling/related competition IDs.
 * Used by RelatedCompetitions component on competition pages.
 */
const COMPETITION_FAMILIES: Record<number, number[]> = {
  // FIFA World Cup family
  1: [29, 32, 31, 34, 30, 33, 37], // WC 2026 → all qualifiers
  29: [1, 32, 31, 34, 30, 33, 37], // WC Qual Africa → WC + other quals
  32: [1, 29, 31, 34, 30, 33, 37], // WC Qual Europe
  31: [1, 29, 32, 34, 30, 33, 37], // WC Qual CONCACAF
  34: [1, 29, 32, 31, 30, 33, 37], // WC Qual South America
  30: [1, 29, 32, 31, 34, 33, 37], // WC Qual Asia
  33: [1, 29, 32, 31, 34, 30, 37], // WC Qual Oceania
  37: [1, 29, 32, 31, 34, 30, 33], // WC Qual Intercontinental

  // Morocco family
  200: [201, 822], // Botola Pro → Botola 2, Coupe du Trône
  201: [200, 822], // Botola 2 → Botola Pro, Coupe du Trône
  822: [200, 201], // Coupe du Trône → Botola Pro, Botola 2

  // CAF family
  6: [36, 12, 20], // AFCON → AFCON Qual, CAF CL, CAF Confed
  36: [6, 12, 20], // AFCON Qual → AFCON, CAF CL, CAF Confed
  922: [6, 36, 12, 20], // WAFCON → AFCON, AFCON Qual, CAF CL, CAF Confed
  12: [20, 6, 36], // CAF CL → CAF Confed, AFCON, AFCON Qual
  20: [12, 6, 36], // CAF Confed → CAF CL, AFCON, AFCON Qual

  // UEFA club cups
  2: [3, 848], // UCL → UEL, UECL
  3: [2, 848], // UEL → UCL, UECL
  848: [2, 3], // UECL → UCL, UEL

  // Top-5 European leagues (siblings)
  39: [140, 78, 135, 61], // PL → La Liga, Bundesliga, Serie A, Ligue 1
  140: [39, 78, 135, 61], // La Liga → PL, Bundesliga, Serie A, Ligue 1
  78: [39, 140, 135, 61], // Bundesliga → PL, La Liga, Serie A, Ligue 1
  135: [39, 140, 78, 61], // Serie A → PL, La Liga, Bundesliga, Ligue 1
  61: [39, 140, 78, 135], // Ligue 1 → PL, La Liga, Bundesliga, Serie A

  // Women's competitions
  525: [1191, 44, 82, 142, 139], // UWCL → UEFA Europa Cup W, WSL, Frauen BL, Liga F, Serie A W
  1191: [525, 44, 82, 142, 139], // UEFA Europa Cup W → UWCL, WSL, etc.
  44: [525, 82, 142, 139], // FA WSL → UWCL, Frauen BL, Liga F, Serie A W
  82: [525, 44, 142, 139], // Frauen BL → UWCL, WSL, Liga F, Serie A W
  142: [525, 44, 82, 139], // Liga F → UWCL, WSL, Frauen BL, Serie A W
  139: [525, 44, 82, 142], // Serie A W → UWCL, WSL, Frauen BL, Liga F

  // Arab & Turkish leagues (siblings)
  307: [233, 186, 202, 301, 203], // Saudi → Egypt, Algeria, Tunisia, UAE, Turkey
  233: [307, 186, 202, 301, 203], // Egypt → Saudi, Algeria, Tunisia, UAE, Turkey
  186: [307, 233, 202, 301, 203], // Algeria → Saudi, Egypt, Tunisia, UAE, Turkey
  202: [307, 233, 186, 301, 203], // Tunisia → Saudi, Egypt, Algeria, UAE, Turkey
  301: [307, 233, 186, 202, 203], // UAE → Saudi, Egypt, Algeria, Tunisia, Turkey
  203: [307, 233, 186, 202, 301], // Turkey → Saudi, Egypt, Algeria, Tunisia, UAE
};

/** Get related competition IDs for a given competition. Returns empty array if none. */
export function getRelatedCompetitionIds(competitionId: number): number[] {
  return COMPETITION_FAMILIES[competitionId] ?? [];
}
