/**
 * WC 2026 team name localization — Arabic and French.
 * Source: FIFA official standings pages (ar/fr).
 * https://www.fifa.com/ar/tournaments/mens/worldcup/canadamexicousa2026/standings
 * https://www.fifa.com/fr/tournaments/mens/worldcup/canadamexicousa2026/standings
 *
 * Keyed by API-Football team ID (from teams table) to avoid code collisions.
 * Used by scripts/backfill-team-names.ts to populate teams.name jsonb.
 */
export const WC_2026_TEAM_NAMES: Record<
  number,
  { fr: string; ar: string; en?: string; frShort?: string; arShort?: string }
> = {
  // Group A: MEX, SOU, KOR, CZE
  16: { fr: 'Mexique', ar: 'المكسيك' },
  1531: { fr: 'Afrique du Sud', ar: 'جنوب أفريقيا', frShort: 'Afr. du Sud' },
  17: { fr: 'Corée du Sud', ar: 'كوريا الجنوبية' },
  770: { fr: 'Tchéquie', ar: 'التشيك' },

  // Group B: CAN, BOS, QAT, SWI
  5529: { fr: 'Canada', ar: 'كندا' },
  1113: { fr: 'Bosnie-Herzégovine', ar: 'البوسنة والهرسك', frShort: 'Bosnie-Herz.' },
  1569: { fr: 'Qatar', ar: 'قطر' },
  15: { fr: 'Suisse', ar: 'سويسرا' },

  // Group C: BRA, MOR, HAI, SCO
  6: { fr: 'Brésil', ar: 'البرازيل' },
  31: { fr: 'Maroc', ar: 'المغرب' },
  2386: { fr: 'Haïti', ar: 'هايتي' },
  1108: { fr: 'Écosse', ar: 'اسكتلندا' },

  // Group D: USA, PAR, AUS, TUR
  2384: { fr: 'États-Unis', ar: 'الولايات المتحدة' },
  2380: { fr: 'Paraguay', ar: 'باراغواي' },
  20: { fr: 'Australie', ar: 'أستراليا' },
  777: { fr: 'Turquie', ar: 'تركيا' },

  // Group E: GER, CUW, IVO, ECU
  25: { fr: 'Allemagne', ar: 'ألمانيا' },
  5530: { fr: 'Curaçao', ar: 'كوراساو' },
  1501: { fr: "Côte d'Ivoire", ar: 'ساحل العاج' },
  2382: { fr: 'Équateur', ar: 'الإكوادور' },

  // Group F: NET, JAP, SWE, TUN
  1118: { fr: 'Pays-Bas', ar: 'هولندا' },
  12: { fr: 'Japon', ar: 'اليابان' },
  5: { fr: 'Suède', ar: 'السويد' },
  28: { fr: 'Tunisie', ar: 'تونس' },

  // Group G: BEL, EGY, IRA(Iran), ZEA
  1: { fr: 'Belgique', ar: 'بلجيكا' },
  32: { fr: 'Égypte', ar: 'مصر' },
  22: { fr: 'Iran', ar: 'إيران' },
  4673: { fr: 'Nouvelle-Zélande', ar: 'نيوزيلندا', frShort: 'Nvle-Zélande' },

  // Group H: SPA, CAP, SAU, URU
  9: { fr: 'Espagne', ar: 'إسبانيا' },
  1533: { fr: 'Cap-Vert', ar: 'الرأس الأخضر', en: 'Cape Verde' },
  23: { fr: 'Arabie saoudite', ar: 'السعودية', frShort: 'Arabie sao.' },
  7: { fr: 'Uruguay', ar: 'الأوروغواي' },

  // Group I: FRA, SEN, IRA(Iraq), NOR
  2: { fr: 'France', ar: 'فرنسا' },
  13: { fr: 'Sénégal', ar: 'السنغال' },
  1567: { fr: 'Irak', ar: 'العراق' },
  1090: { fr: 'Norvège', ar: 'النرويج' },

  // Group J: ARG, ALG, AUS(Austria), JOR
  26: { fr: 'Argentine', ar: 'الأرجنتين' },
  1532: { fr: 'Algérie', ar: 'الجزائر' },
  775: { fr: 'Autriche', ar: 'النمسا' },
  1548: { fr: 'Jordanie', ar: 'الأردن' },

  // Group K: POR, CON, UZB, COL
  27: { fr: 'Portugal', ar: 'البرتغال' },
  1508: { fr: 'RD Congo', ar: 'الكونغو الديمقراطية' },
  1568: { fr: 'Ouzbékistan', ar: 'أوزبكستان' },
  8: { fr: 'Colombie', ar: 'كولومبيا' },

  // Group L: ENG, CRO, GHA, PAN
  10: { fr: 'Angleterre', ar: 'إنجلترا' },
  3: { fr: 'Croatie', ar: 'كرواتيا' },
  1504: { fr: 'Ghana', ar: 'غانا' },
  11: { fr: 'Panama', ar: 'بنما' },
};
