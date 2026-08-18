import type { Locale } from '@/lib/i18n/config';

/**
 * FIFA/Coca-Cola Men's World Ranking — published snapshot.
 *
 * PHASE 1 (this file): a verified, versioned constant seeded verbatim from the official
 * FIFA release. FIFA only updates the ranking at the end of each international match window,
 * so a periodically-refreshed constant is accurate between windows with zero infra.
 *
 * PHASE 2 (future): an internal SUM-algorithm recompute pipeline writes to a
 * `national_team_rankings` table and this constant is retired / re-seeded on each official
 * release. Movement (▲/▼ vs previous rank) lands then, when we hold both numbers.
 *
 * Source: https://inside.fifa.com/fifa-rankings/world-ranking/men
 */

export interface FifaRankingRow {
  /** 1-based world rank. */
  rank: number;
  /** FIFA 3-letter country code (IOC-style; not ISO alpha-2). */
  code: string;
  /** Total ranking points. */
  points: number;
}

export interface FifaCountryMeta {
  /** ISO-3166 alpha-2 (lowercase) for the api-sports flag; api-sports UK sub-codes for home nations. */
  iso2: string;
  name: { en: string; fr: string; ar: string };
}

export interface ResolvedFifaRankingRow {
  rank: number;
  code: string;
  /** null when the code isn't in COUNTRY_META — the card falls back to the raw code as label. */
  iso2: string | null;
  name: string;
  points: number;
  /** true for the pinned nation (Morocco) so the card can highlight its row. */
  isPinned: boolean;
}

/** Release metadata for the snapshot below. */
export const FIFA_RANKING_META = {
  /** Last official update (ISO date). */
  updatedAt: '2026-07-20',
  /** Next scheduled official update (ISO date). */
  nextUpdateAt: '2026-10-07',
} as const;

/**
 * Localized display metadata for the nations we surface (top of the table + key CAF / Arab
 * nations for a Morocco-first audience). Codes absent here still appear in the raw snapshot;
 * the card just shows the FIFA code as the label until they're added.
 */
export const COUNTRY_META: Record<string, FifaCountryMeta> = {
  ESP: { iso2: 'es', name: { en: 'Spain', fr: 'Espagne', ar: 'إسبانيا' } },
  ARG: { iso2: 'ar', name: { en: 'Argentina', fr: 'Argentine', ar: 'الأرجنتين' } },
  FRA: { iso2: 'fr', name: { en: 'France', fr: 'France', ar: 'فرنسا' } },
  ENG: { iso2: 'gb-eng', name: { en: 'England', fr: 'Angleterre', ar: 'إنجلترا' } },
  BRA: { iso2: 'br', name: { en: 'Brazil', fr: 'Brésil', ar: 'البرازيل' } },
  MAR: { iso2: 'ma', name: { en: 'Morocco', fr: 'Maroc', ar: 'المغرب' } },
  POR: { iso2: 'pt', name: { en: 'Portugal', fr: 'Portugal', ar: 'البرتغال' } },
  BEL: { iso2: 'be', name: { en: 'Belgium', fr: 'Belgique', ar: 'بلجيكا' } },
  NED: { iso2: 'nl', name: { en: 'Netherlands', fr: 'Pays-Bas', ar: 'هولندا' } },
  MEX: { iso2: 'mx', name: { en: 'Mexico', fr: 'Mexique', ar: 'المكسيك' } },
  COL: { iso2: 'co', name: { en: 'Colombia', fr: 'Colombie', ar: 'كولومبيا' } },
  GER: { iso2: 'de', name: { en: 'Germany', fr: 'Allemagne', ar: 'ألمانيا' } },
  CRO: { iso2: 'hr', name: { en: 'Croatia', fr: 'Croatie', ar: 'كرواتيا' } },
  SUI: { iso2: 'ch', name: { en: 'Switzerland', fr: 'Suisse', ar: 'سويسرا' } },
  ITA: { iso2: 'it', name: { en: 'Italy', fr: 'Italie', ar: 'إيطاليا' } },
  USA: { iso2: 'us', name: { en: 'United States', fr: 'États-Unis', ar: 'الولايات المتحدة' } },
  JPN: { iso2: 'jp', name: { en: 'Japan', fr: 'Japon', ar: 'اليابان' } },
  SEN: { iso2: 'sn', name: { en: 'Senegal', fr: 'Sénégal', ar: 'السنغال' } },
  NOR: { iso2: 'no', name: { en: 'Norway', fr: 'Norvège', ar: 'النرويج' } },
  URU: { iso2: 'uy', name: { en: 'Uruguay', fr: 'Uruguay', ar: 'الأوروغواي' } },
  DEN: { iso2: 'dk', name: { en: 'Denmark', fr: 'Danemark', ar: 'الدنمارك' } },
  IRN: { iso2: 'ir', name: { en: 'Iran', fr: 'Iran', ar: 'إيران' } },
  AUT: { iso2: 'at', name: { en: 'Austria', fr: 'Autriche', ar: 'النمسا' } },
  EGY: { iso2: 'eg', name: { en: 'Egypt', fr: 'Égypte', ar: 'مصر' } },
  ECU: { iso2: 'ec', name: { en: 'Ecuador', fr: 'Équateur', ar: 'الإكوادور' } },
  NGA: { iso2: 'ng', name: { en: 'Nigeria', fr: 'Nigéria', ar: 'نيجيريا' } },
  TUR: { iso2: 'tr', name: { en: 'Turkey', fr: 'Turquie', ar: 'تركيا' } },
  AUS: { iso2: 'au', name: { en: 'Australia', fr: 'Australie', ar: 'أستراليا' } },
  ALG: { iso2: 'dz', name: { en: 'Algeria', fr: 'Algérie', ar: 'الجزائر' } },
  CAN: { iso2: 'ca', name: { en: 'Canada', fr: 'Canada', ar: 'كندا' } },
  CIV: { iso2: 'ci', name: { en: "Côte d'Ivoire", fr: "Côte d'Ivoire", ar: 'ساحل العاج' } },
  KOR: { iso2: 'kr', name: { en: 'South Korea', fr: 'Corée du Sud', ar: 'كوريا الجنوبية' } },
  COD: { iso2: 'cd', name: { en: 'DR Congo', fr: 'RD Congo', ar: 'الكونغو الديمقراطية' } },
  CMR: { iso2: 'cm', name: { en: 'Cameroon', fr: 'Cameroun', ar: 'الكاميرون' } },
  MLI: { iso2: 'ml', name: { en: 'Mali', fr: 'Mali', ar: 'مالي' } },
  RSA: { iso2: 'za', name: { en: 'South Africa', fr: 'Afrique du Sud', ar: 'جنوب أفريقيا' } },
  TUN: { iso2: 'tn', name: { en: 'Tunisia', fr: 'Tunisie', ar: 'تونس' } },
  BFA: { iso2: 'bf', name: { en: 'Burkina Faso', fr: 'Burkina Faso', ar: 'بوركينا فاسو' } },
  CPV: { iso2: 'cv', name: { en: 'Cape Verde', fr: 'Cap-Vert', ar: 'الرأس الأخضر' } },
  GHA: { iso2: 'gh', name: { en: 'Ghana', fr: 'Ghana', ar: 'غانا' } },
  GUI: { iso2: 'gn', name: { en: 'Guinea', fr: 'Guinée', ar: 'غينيا' } },
  KSA: { iso2: 'sa', name: { en: 'Saudi Arabia', fr: 'Arabie saoudite', ar: 'السعودية' } },
  UAE: { iso2: 'ae', name: { en: 'UAE', fr: 'Émirats arabes unis', ar: 'الإمارات' } },
  QAT: { iso2: 'qa', name: { en: 'Qatar', fr: 'Qatar', ar: 'قطر' } },
  IRQ: { iso2: 'iq', name: { en: 'Iraq', fr: 'Irak', ar: 'العراق' } },
  JOR: { iso2: 'jo', name: { en: 'Jordan', fr: 'Jordanie', ar: 'الأردن' } },
  // UK home nations + Kosovo: Intl.DisplayNames has no region entry for these codes.
  WAL: { iso2: 'gb-wls', name: { en: 'Wales', fr: 'Pays de Galles', ar: 'ويلز' } },
  SCO: { iso2: 'gb-sct', name: { en: 'Scotland', fr: 'Écosse', ar: 'اسكتلندا' } },
  NIR: {
    iso2: 'gb-nir',
    name: { en: 'Northern Ireland', fr: 'Irlande du Nord', ar: 'أيرلندا الشمالية' },
  },
  KOS: { iso2: 'xk', name: { en: 'Kosovo', fr: 'Kosovo', ar: 'كوسوفو' } },
};

/**
 * Full 211-nation snapshot, in rank order, from the official 20 July 2026 update.
 * Rank is stored explicitly (== array position + 1) for clarity and Phase-2 robustness.
 */
export const FIFA_RANKING_SNAPSHOT: readonly FifaRankingRow[] = [
  { rank: 1, code: 'ESP', points: 1995.88 },
  { rank: 2, code: 'ARG', points: 1970.37 },
  { rank: 3, code: 'FRA', points: 1948.97 },
  { rank: 4, code: 'ENG', points: 1922.83 },
  { rank: 5, code: 'BRA', points: 1804.92 },
  { rank: 6, code: 'MAR', points: 1803.99 },
  { rank: 7, code: 'POR', points: 1787.85 },
  { rank: 8, code: 'BEL', points: 1778.36 },
  { rank: 9, code: 'NED', points: 1775.54 },
  { rank: 10, code: 'MEX', points: 1754.3 },
  { rank: 11, code: 'COL', points: 1739.89 },
  { rank: 12, code: 'GER', points: 1726.22 },
  { rank: 13, code: 'CRO', points: 1723.05 },
  { rank: 14, code: 'SUI', points: 1710.88 },
  { rank: 15, code: 'ITA', points: 1704.73 },
  { rank: 16, code: 'USA', points: 1690.33 },
  { rank: 17, code: 'JPN', points: 1673.68 },
  { rank: 18, code: 'SEN', points: 1653.43 },
  { rank: 19, code: 'NOR', points: 1651.29 },
  { rank: 20, code: 'URU', points: 1634.7 },
  { rank: 21, code: 'DEN', points: 1619.47 },
  { rank: 22, code: 'IRN', points: 1609.85 },
  { rank: 23, code: 'AUT', points: 1598.82 },
  { rank: 24, code: 'EGY', points: 1597.04 },
  { rank: 25, code: 'ECU', points: 1592.59 },
  { rank: 26, code: 'NGA', points: 1585.02 },
  { rank: 27, code: 'TUR', points: 1582.54 },
  { rank: 28, code: 'AUS', points: 1581.51 },
  { rank: 29, code: 'ALG', points: 1576.8 },
  { rank: 30, code: 'CAN', points: 1571.34 },
  { rank: 31, code: 'CIV', points: 1565.47 },
  { rank: 32, code: 'KOR', points: 1558.72 },
  { rank: 33, code: 'UKR', points: 1549.29 },
  { rank: 34, code: 'PAR', points: 1542.48 },
  { rank: 35, code: 'RUS', points: 1529.6 },
  { rank: 36, code: 'POL', points: 1526.18 },
  { rank: 37, code: 'SWE', points: 1525.58 },
  { rank: 38, code: 'WAL', points: 1516.95 },
  { rank: 39, code: 'HUN', points: 1506.39 },
  { rank: 40, code: 'SRB', points: 1502.13 },
  { rank: 41, code: 'COD', points: 1495.48 },
  { rank: 42, code: 'SCO', points: 1491.22 },
  { rank: 43, code: 'CMR', points: 1481.24 },
  { rank: 44, code: 'PAN', points: 1478.41 },
  { rank: 45, code: 'SVK', points: 1473.66 },
  { rank: 46, code: 'GRE', points: 1473.19 },
  { rank: 47, code: 'VEN', points: 1469.18 },
  { rank: 48, code: 'CZE', points: 1467.26 },
  { rank: 49, code: 'CHI', points: 1458.2 },
  { rank: 50, code: 'PER', points: 1457.69 },
  { rank: 51, code: 'CRC', points: 1456.03 },
  { rank: 52, code: 'ROU', points: 1455.89 },
  { rank: 53, code: 'MLI', points: 1455.59 },
  { rank: 54, code: 'RSA', points: 1451.24 },
  { rank: 55, code: 'IRL', points: 1441.1 },
  { rank: 56, code: 'SVN', points: 1441.09 },
  { rank: 57, code: 'TUN', points: 1426.58 },
  { rank: 58, code: 'KSA', points: 1425.52 },
  { rank: 59, code: 'QAT', points: 1411.06 },
  { rank: 60, code: 'UZB', points: 1409.73 },
  { rank: 61, code: 'BIH', points: 1408.93 },
  { rank: 62, code: 'BFA', points: 1406.99 },
  { rank: 63, code: 'IRQ', points: 1404.17 },
  { rank: 64, code: 'CPV', points: 1402.97 },
  { rank: 65, code: 'GHA', points: 1387.0 },
  { rank: 66, code: 'HON', points: 1378.97 },
  { rank: 67, code: 'ALB', points: 1376.03 },
  { rank: 68, code: 'UAE', points: 1370.47 },
  { rank: 69, code: 'MKD', points: 1369.16 },
  { rank: 70, code: 'NIR', points: 1365.3 },
  { rank: 71, code: 'JAM', points: 1357.84 },
  { rank: 72, code: 'GEO', points: 1355.26 },
  { rank: 73, code: 'JOR', points: 1350.41 },
  { rank: 74, code: 'ISL', points: 1342.77 },
  { rank: 75, code: 'FIN', points: 1341.92 },
  { rank: 76, code: 'ISR', points: 1333.9 },
  { rank: 77, code: 'BOL', points: 1326.0 },
  { rank: 78, code: 'KOS', points: 1319.12 },
  { rank: 79, code: 'OMA', points: 1306.9 },
  { rank: 80, code: 'MNE', points: 1301.98 },
  { rank: 81, code: 'GUI', points: 1295.6 },
  { rank: 82, code: 'CUW', points: 1285.64 },
  { rank: 83, code: 'SYR', points: 1283.05 },
  { rank: 84, code: 'GAB', points: 1272.51 },
  { rank: 85, code: 'BUL', points: 1271.68 },
  { rank: 86, code: 'NZL', points: 1269.8 },
  { rank: 87, code: 'ANG', points: 1265.58 },
  { rank: 88, code: 'HAI', points: 1264.58 },
  { rank: 89, code: 'UGA', points: 1264.09 },
  { rank: 90, code: 'ZAM', points: 1255.82 },
  { rank: 91, code: 'CHN', points: 1254.81 },
  { rank: 92, code: 'BHR', points: 1254.41 },
  { rank: 93, code: 'BEN', points: 1252.17 },
  { rank: 94, code: 'THA', points: 1250.8 },
  { rank: 95, code: 'PLE', points: 1243.71 },
  { rank: 96, code: 'BLR', points: 1242.88 },
  { rank: 97, code: 'GUA', points: 1238.74 },
  { rank: 98, code: 'LUX', points: 1232.82 },
  { rank: 99, code: 'VIE', points: 1227.2 },
  { rank: 100, code: 'SLV', points: 1225.34 },
  { rank: 101, code: 'TJK', points: 1224.19 },
  { rank: 102, code: 'TRI', points: 1219.59 },
  { rank: 103, code: 'MOZ', points: 1218.62 },
  { rank: 104, code: 'MAD', points: 1202.69 },
  { rank: 105, code: 'EQG', points: 1195.2 },
  { rank: 106, code: 'KGZ', points: 1192.16 },
  { rank: 107, code: 'ARM', points: 1189.63 },
  { rank: 108, code: 'COM', points: 1187.91 },
  { rank: 109, code: 'KEN', points: 1185.08 },
  { rank: 110, code: 'LBY', points: 1182.08 },
  { rank: 111, code: 'KAZ', points: 1180.78 },
  { rank: 112, code: 'TAN', points: 1180.27 },
  { rank: 113, code: 'MTN', points: 1176.68 },
  { rank: 114, code: 'NIG', points: 1175.33 },
  { rank: 115, code: 'LBN', points: 1172.22 },
  { rank: 116, code: 'GAM', points: 1159.64 },
  { rank: 117, code: 'SDN', points: 1157.22 },
  { rank: 118, code: 'IDN', points: 1157.14 },
  { rank: 119, code: 'TOG', points: 1152.76 },
  { rank: 120, code: 'PRK', points: 1151.05 },
  { rank: 121, code: 'NAM', points: 1148.84 },
  { rank: 122, code: 'SLE', points: 1147.56 },
  { rank: 123, code: 'FRO', points: 1136.59 },
  { rank: 124, code: 'CYP', points: 1133.25 },
  { rank: 125, code: 'SUR', points: 1132.43 },
  { rank: 126, code: 'AZE', points: 1132.0 },
  { rank: 127, code: 'EST', points: 1130.64 },
  { rank: 128, code: 'RWA', points: 1126.62 },
  { rank: 129, code: 'MWI', points: 1122.05 },
  { rank: 130, code: 'ZIM', points: 1119.78 },
  { rank: 131, code: 'NCA', points: 1114.63 },
  { rank: 132, code: 'GNB', points: 1108.38 },
  { rank: 133, code: 'KUW', points: 1106.47 },
  { rank: 134, code: 'CGO', points: 1105.96 },
  { rank: 135, code: 'PHI', points: 1100.95 },
  { rank: 136, code: 'MAS', points: 1086.22 },
  { rank: 137, code: 'LVA', points: 1085.66 },
  { rank: 138, code: 'IND', points: 1084.93 },
  { rank: 139, code: 'CTA', points: 1080.82 },
  { rank: 140, code: 'LBR', points: 1080.44 },
  { rank: 141, code: 'TKM', points: 1078.65 },
  { rank: 142, code: 'BDI', points: 1078.01 },
  { rank: 143, code: 'ETH', points: 1077.52 },
  { rank: 144, code: 'DOM', points: 1076.5 },
  { rank: 145, code: 'YEM', points: 1065.24 },
  { rank: 146, code: 'LES', points: 1064.29 },
  { rank: 147, code: 'BOT', points: 1063.63 },
  { rank: 148, code: 'SGP', points: 1057.95 },
  { rank: 149, code: 'LTU', points: 1056.85 },
  { rank: 150, code: 'GUY', points: 1049.32 },
  { rank: 151, code: 'NCL', points: 1036.95 },
  { rank: 152, code: 'SKN', points: 1036.33 },
  { rank: 153, code: 'SOL', points: 1031.89 },
  { rank: 154, code: 'PUR', points: 1024.3 },
  { rank: 155, code: 'FIJ', points: 1024.17 },
  { rank: 156, code: 'HKG', points: 1024.16 },
  { rank: 157, code: 'TAH', points: 1019.04 },
  { rank: 158, code: 'MYA', points: 1009.39 },
  { rank: 159, code: 'MDA', points: 1008.24 },
  { rank: 160, code: 'VAN', points: 1002.53 },
  { rank: 161, code: 'MLT', points: 992.79 },
  { rank: 162, code: 'ATG', points: 986.58 },
  { rank: 163, code: 'GRN', points: 981.82 },
  { rank: 164, code: 'CUB', points: 981.42 },
  { rank: 165, code: 'SWZ', points: 979.01 },
  { rank: 166, code: 'LCA', points: 976.71 },
  { rank: 167, code: 'BER', points: 975.05 },
  { rank: 168, code: 'PNG', points: 974.9 },
  { rank: 169, code: 'SSD', points: 970.94 },
  { rank: 170, code: 'VIN', points: 968.27 },
  { rank: 171, code: 'AFG', points: 968.07 },
  { rank: 172, code: 'AND', points: 946.43 },
  { rank: 173, code: 'MDV', points: 943.92 },
  { rank: 174, code: 'TPE', points: 923.78 },
  { rank: 175, code: 'CAM', points: 922.32 },
  { rank: 176, code: 'MSR', points: 916.75 },
  { rank: 177, code: 'NEP', points: 914.54 },
  { rank: 178, code: 'MRI', points: 911.49 },
  { rank: 179, code: 'BRB', points: 909.89 },
  { rank: 180, code: 'BLZ', points: 907.0 },
  { rank: 181, code: 'BAN', points: 902.93 },
  { rank: 182, code: 'DMA', points: 897.69 },
  { rank: 183, code: 'CHA', points: 896.85 },
  { rank: 184, code: 'ERI', points: 887.06 },
  { rank: 185, code: 'LAO', points: 885.03 },
  { rank: 186, code: 'COK', points: 877.53 },
  { rank: 187, code: 'SRI', points: 876.86 },
  { rank: 188, code: 'SAM', points: 876.41 },
  { rank: 189, code: 'ARU', points: 875.61 },
  { rank: 190, code: 'MNG', points: 874.47 },
  { rank: 191, code: 'ASA', points: 871.61 },
  { rank: 192, code: 'BHU', points: 870.81 },
  { rank: 193, code: 'MAC', points: 858.03 },
  { rank: 194, code: 'BRU', points: 857.73 },
  { rank: 195, code: 'STP', points: 855.44 },
  { rank: 196, code: 'DJI', points: 853.58 },
  { rank: 197, code: 'CAY', points: 850.06 },
  { rank: 198, code: 'PAK', points: 840.28 },
  { rank: 199, code: 'SOM', points: 839.17 },
  { rank: 200, code: 'TGA', points: 835.64 },
  { rank: 201, code: 'TLS', points: 831.0 },
  { rank: 202, code: 'GIB', points: 820.26 },
  { rank: 203, code: 'GUM', points: 819.54 },
  { rank: 204, code: 'SEY', points: 804.16 },
  { rank: 205, code: 'TCA', points: 803.98 },
  { rank: 206, code: 'LIE', points: 797.7 },
  { rank: 207, code: 'BAH', points: 786.82 },
  { rank: 208, code: 'VIR', points: 779.76 },
  { rank: 209, code: 'VGB', points: 777.41 },
  { rank: 210, code: 'AIA', points: 760.25 },
  { rank: 211, code: 'SMR', points: 721.2 },
];

/**
 * FIFA 3-letter code → api-sports flag code (ISO alpha-2 lowercase; api-sports UK sub-codes for the
 * home nations). Covers all 211 nations so the full-ranking page can render every flag. Curated
 * football-standard names + the few non-ISO codes (UK nations, Kosovo) live in COUNTRY_META and
 * take precedence; the long tail gets its localized name from Intl.DisplayNames on this iso2.
 */
export const FIFA_TO_ISO2: Record<string, string> = {
  ESP: 'es',
  ARG: 'ar',
  FRA: 'fr',
  ENG: 'gb-eng',
  BRA: 'br',
  MAR: 'ma',
  POR: 'pt',
  BEL: 'be',
  NED: 'nl',
  MEX: 'mx',
  COL: 'co',
  GER: 'de',
  CRO: 'hr',
  SUI: 'ch',
  ITA: 'it',
  USA: 'us',
  JPN: 'jp',
  SEN: 'sn',
  NOR: 'no',
  URU: 'uy',
  DEN: 'dk',
  IRN: 'ir',
  AUT: 'at',
  EGY: 'eg',
  ECU: 'ec',
  NGA: 'ng',
  TUR: 'tr',
  AUS: 'au',
  ALG: 'dz',
  CAN: 'ca',
  CIV: 'ci',
  KOR: 'kr',
  UKR: 'ua',
  PAR: 'py',
  RUS: 'ru',
  POL: 'pl',
  SWE: 'se',
  WAL: 'gb-wls',
  HUN: 'hu',
  SRB: 'rs',
  COD: 'cd',
  SCO: 'gb-sct',
  CMR: 'cm',
  PAN: 'pa',
  SVK: 'sk',
  GRE: 'gr',
  VEN: 've',
  CZE: 'cz',
  CHI: 'cl',
  PER: 'pe',
  CRC: 'cr',
  ROU: 'ro',
  MLI: 'ml',
  RSA: 'za',
  IRL: 'ie',
  SVN: 'si',
  TUN: 'tn',
  KSA: 'sa',
  QAT: 'qa',
  UZB: 'uz',
  BIH: 'ba',
  BFA: 'bf',
  IRQ: 'iq',
  CPV: 'cv',
  GHA: 'gh',
  HON: 'hn',
  ALB: 'al',
  UAE: 'ae',
  MKD: 'mk',
  NIR: 'gb-nir',
  JAM: 'jm',
  GEO: 'ge',
  JOR: 'jo',
  ISL: 'is',
  FIN: 'fi',
  ISR: 'il',
  BOL: 'bo',
  KOS: 'xk',
  OMA: 'om',
  MNE: 'me',
  GUI: 'gn',
  CUW: 'cw',
  SYR: 'sy',
  GAB: 'ga',
  BUL: 'bg',
  NZL: 'nz',
  ANG: 'ao',
  HAI: 'ht',
  UGA: 'ug',
  ZAM: 'zm',
  CHN: 'cn',
  BHR: 'bh',
  BEN: 'bj',
  THA: 'th',
  PLE: 'ps',
  BLR: 'by',
  GUA: 'gt',
  LUX: 'lu',
  VIE: 'vn',
  SLV: 'sv',
  TJK: 'tj',
  TRI: 'tt',
  MOZ: 'mz',
  MAD: 'mg',
  EQG: 'gq',
  KGZ: 'kg',
  ARM: 'am',
  COM: 'km',
  KEN: 'ke',
  LBY: 'ly',
  KAZ: 'kz',
  TAN: 'tz',
  MTN: 'mr',
  NIG: 'ne',
  LBN: 'lb',
  GAM: 'gm',
  SDN: 'sd',
  IDN: 'id',
  TOG: 'tg',
  PRK: 'kp',
  NAM: 'na',
  SLE: 'sl',
  FRO: 'fo',
  CYP: 'cy',
  SUR: 'sr',
  AZE: 'az',
  EST: 'ee',
  RWA: 'rw',
  MWI: 'mw',
  ZIM: 'zw',
  NCA: 'ni',
  GNB: 'gw',
  KUW: 'kw',
  CGO: 'cg',
  PHI: 'ph',
  MAS: 'my',
  LVA: 'lv',
  IND: 'in',
  CTA: 'cf',
  LBR: 'lr',
  TKM: 'tm',
  BDI: 'bi',
  ETH: 'et',
  DOM: 'do',
  YEM: 'ye',
  LES: 'ls',
  BOT: 'bw',
  SGP: 'sg',
  LTU: 'lt',
  GUY: 'gy',
  NCL: 'nc',
  SKN: 'kn',
  SOL: 'sb',
  PUR: 'pr',
  FIJ: 'fj',
  HKG: 'hk',
  TAH: 'pf',
  MYA: 'mm',
  MDA: 'md',
  VAN: 'vu',
  MLT: 'mt',
  ATG: 'ag',
  GRN: 'gd',
  CUB: 'cu',
  SWZ: 'sz',
  LCA: 'lc',
  BER: 'bm',
  PNG: 'pg',
  SSD: 'ss',
  VIN: 'vc',
  AFG: 'af',
  AND: 'ad',
  MDV: 'mv',
  TPE: 'tw',
  CAM: 'kh',
  MSR: 'ms',
  NEP: 'np',
  MRI: 'mu',
  BRB: 'bb',
  BLZ: 'bz',
  BAN: 'bd',
  DMA: 'dm',
  CHA: 'td',
  ERI: 'er',
  LAO: 'la',
  COK: 'ck',
  SRI: 'lk',
  SAM: 'ws',
  ARU: 'aw',
  MNG: 'mn',
  ASA: 'as',
  BHU: 'bt',
  MAC: 'mo',
  BRU: 'bn',
  STP: 'st',
  DJI: 'dj',
  CAY: 'ky',
  PAK: 'pk',
  SOM: 'so',
  TGA: 'to',
  TLS: 'tl',
  GIB: 'gi',
  GUM: 'gu',
  SEY: 'sc',
  TCA: 'tc',
  LIE: 'li',
  BAH: 'bs',
  VIR: 'vi',
  VGB: 'vg',
  AIA: 'ai',
  SMR: 'sm',
};

/**
 * Build a locale-bound country resolver reusing one Intl.DisplayNames instance across rows.
 * COUNTRY_META wins for curated football names + flags; otherwise the flag comes from FIFA_TO_ISO2
 * and the name from Intl.DisplayNames, falling back to the raw FIFA code when neither resolves.
 */
function makeCountryResolver(locale: Locale) {
  const display = new Intl.DisplayNames([locale], { type: 'region' });
  return (code: string): { iso2: string | null; name: string } => {
    const meta = COUNTRY_META[code];
    if (meta) return { iso2: meta.iso2, name: meta.name[locale] };
    const iso2 = FIFA_TO_ISO2[code] ?? null;
    let name = code;
    if (iso2 && iso2.length === 2) {
      try {
        name = display.of(iso2.toUpperCase()) ?? code;
      } catch {
        name = code;
      }
    }
    return { iso2, name };
  };
}

/**
 * Resolve the top `limit` nations for display. Pinning is opt-in: pass a `pinCode` to highlight
 * that nation and append its row if it falls outside the top `limit`; with no `pinCode` (default)
 * the list is a plain top-N with no highlighted row.
 */
export function getFifaRankingTop(
  locale: Locale,
  { limit = 8, pinCode = null }: { limit?: number; pinCode?: string | null } = {},
): ResolvedFifaRankingRow[] {
  const resolveCountry = makeCountryResolver(locale);
  const resolve = (row: FifaRankingRow): ResolvedFifaRankingRow => {
    const c = resolveCountry(row.code);
    return {
      rank: row.rank,
      code: row.code,
      iso2: c.iso2,
      name: c.name,
      points: row.points,
      isPinned: pinCode != null && row.code === pinCode,
    };
  };

  const top = FIFA_RANKING_SNAPSHOT.slice(0, limit).map(resolve);

  if (pinCode != null && !top.some((r) => r.code === pinCode)) {
    const pinned = FIFA_RANKING_SNAPSHOT.find((r) => r.code === pinCode);
    if (pinned) top.push(resolve(pinned));
  }

  return top;
}

/** Full 211-nation ranking, resolved (localized name + flag) for the full-ranking page. */
export function getFullFifaRanking(locale: Locale): ResolvedFifaRankingRow[] {
  const resolveCountry = makeCountryResolver(locale);
  return FIFA_RANKING_SNAPSHOT.map((row) => {
    const c = resolveCountry(row.code);
    return {
      rank: row.rank,
      code: row.code,
      iso2: c.iso2,
      name: c.name,
      points: row.points,
      isPinned: false,
    };
  });
}
