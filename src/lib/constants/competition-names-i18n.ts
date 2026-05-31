/**
 * Static locale overrides for competition display names.
 *
 * The DB stores competition.name as JSONB with only an "en" key (from API-Football).
 * This lookup provides fr + ar translations for the 36 verified competitions.
 *
 * Usage: getLocalizedCompetitionName(competition, locale)
 */

const COMP_NAMES: Record<number, { en?: string; fr: string; ar: string }> = {
  // ── World Cup & qualifiers ──
  1: { fr: 'Coupe du Monde', ar: 'كأس العالم' },
  29: { fr: 'Qualif. CM Afrique', ar: 'تصفيات كأس العالم أفريقيا' },
  32: { fr: 'Qualif. CM Europe', ar: 'تصفيات كأس العالم أوروبا' },
  31: { fr: 'Qualif. CM CONCACAF', ar: 'تصفيات كأس العالم كونكاكاف' },
  34: { fr: 'Qualif. CM Am. du Sud', ar: 'تصفيات كأس العالم أمريكا الجنوبية' },
  30: { fr: 'Qualif. CM Asie', ar: 'تصفيات كأس العالم آسيا' },
  33: { fr: 'Qualif. CM Océanie', ar: 'تصفيات كأس العالم أوقيانوسيا' },
  37: { fr: 'Qualif. CM Intercontinental', ar: 'تصفيات كأس العالم بين القارات' },

  // ── Morocco ──
  200: { fr: 'Botola Pro', ar: 'البطولة الاحترافية' },
  201: { fr: 'Botola Pro 2', ar: 'البطولة الاحترافية 2' },
  822: { en: 'Coupe du Trône', fr: 'Coupe du Trône', ar: 'كأس العرش' },

  // ── Africa ──
  6: { fr: 'CAN', ar: 'كأس أمم إفريقيا' },
  36: { fr: 'Qualif. CAN', ar: 'تصفيات كأس أمم إفريقيا' },
  922: { fr: 'CAN Féminine', ar: 'كأس أمم إفريقيا للسيدات' },
  12: { fr: 'Ligue des Champions CAF', ar: 'دوري أبطال أفريقيا' },
  20: { fr: 'Coupe de la Confédération CAF', ar: 'كأس الكونفدرالية الأفريقية' },

  // ── Europe — men ──
  39: { fr: 'Premier League', ar: 'الدوري الإنجليزي الممتاز' },
  140: { fr: 'LaLiga', ar: 'الدوري الإسباني' },
  135: { fr: 'Serie A', ar: 'الدوري الإيطالي' },
  78: { fr: 'Bundesliga', ar: 'الدوري الألماني' },
  61: { fr: 'Ligue 1', ar: 'الدوري الفرنسي' },
  2: { fr: 'Ligue des Champions', ar: 'دوري أبطال أوروبا' },
  3: { fr: 'Ligue Europa', ar: 'الدوري الأوروبي' },
  848: { fr: 'Ligue Europa Conférence', ar: 'دوري المؤتمر الأوروبي' },

  // ── Europe — women ──
  44: { fr: 'FA WSL', ar: 'الدوري الإنجليزي للسيدات' },
  142: { fr: 'Liga F', ar: 'الدوري الإسباني للسيدات' },
  139: { fr: 'Serie A Femminile', ar: 'الدوري الإيطالي للسيدات' },
  82: { fr: 'Frauen-Bundesliga', ar: 'الدوري الألماني للسيدات' },
  525: { fr: 'Ligue des Champions Féminine', ar: 'دوري أبطال أوروبا للسيدات' },
  1191: { fr: "Coupe d'Europe Féminine", ar: 'كأس أوروبا للسيدات' },

  // ── MENA & others ──
  186: { fr: 'Ligue 1 Algérie', ar: 'الدوري الجزائري' },
  202: { fr: 'Ligue 1 Tunisie', ar: 'الدوري التونسي' },
  233: { fr: 'Premier League Égypte', ar: 'الدوري المصري الممتاز' },
  203: { fr: 'Süper Lig', ar: 'الدوري التركي الممتاز' },
  301: { fr: 'UAE Pro League', ar: 'دوري الخليج العربي' },
  307: { fr: 'Saudi Pro League', ar: 'دوري روشن السعودي' },
};

/**
 * Returns a localized competition name with fallback:
 * static lookup[locale] → DB name[locale] → DB name.en → slug
 */
export function getLocalizedCompetitionName(
  competition: { id: number; name: Record<string, string>; slug: string },
  locale: string,
): string {
  const override = COMP_NAMES[competition.id];
  if (override && locale in override) {
    return (
      override[locale as keyof typeof override] ??
      competition.name[locale] ??
      competition.name['en'] ??
      competition.slug
    );
  }
  return competition.name[locale] ?? competition.name['en'] ?? competition.slug;
}
