import type { Locale } from '@/lib/i18n/config';

// ── League intro paragraphs ──
// Hand-written for priority leagues per competition-league.md Section 5.
// Other leagues get null (no intro rendered).

const LEAGUE_INTROS: Record<number, Record<Locale, string>> = {
  // Botola Pro
  200: {
    fr: 'La Botola Pro est le championnat de football professionnel du Maroc, réunissant 16 clubs dont Wydad AC, Raja CA et AS FAR. Suivez en direct le classement, les matchs et les statistiques de la saison.',
    en: "The Botola Pro is Morocco's top professional football league, featuring 16 clubs including Wydad AC, Raja CA, and AS FAR. Follow live standings, matches, and statistics.",
    ar: 'البطولة الاحترافية هي بطولة كرة القدم للمحترفين في المغرب، تضم 16 ناديًا من بينها الوداد الرياضي والرجاء الرياضي والجيش الملكي. تابعوا مباشرة الترتيب والمباريات والإحصائيات.',
  },
  // Premier League
  39: {
    fr: "La Premier League est le championnat d'Angleterre, considéré comme le plus compétitif au monde. Suivez le classement, les matchs et les statistiques.",
    en: "The Premier League is England's top flight, widely regarded as the most competitive league in the world. Follow standings, matches, and statistics.",
    ar: 'الدوري الإنجليزي الممتاز هو الدوري الأول في إنجلترا، ويُعتبر الأكثر تنافسية في العالم. تابعوا الترتيب والمباريات والإحصائيات.',
  },
  // La Liga
  140: {
    fr: "La Liga est le championnat d'Espagne, dominé historiquement par le Real Madrid et le FC Barcelone. Suivez le classement et les statistiques.",
    en: "La Liga is Spain's top division, historically dominated by Real Madrid and FC Barcelona. Follow standings and statistics.",
    ar: 'الدوري الإسباني هو الدوري الأول في إسبانيا، يهيمن عليه تاريخياً ريال مدريد وبرشلونة. تابعوا الترتيب والإحصائيات.',
  },
  // Bundesliga
  78: {
    fr: "La Bundesliga est le championnat d'Allemagne, reconnu pour ses stades pleins et son football offensif. Suivez le classement et les matchs.",
    en: "The Bundesliga is Germany's top division, known for packed stadiums and attacking football. Follow standings and matches.",
    ar: 'البوندسليغا هو الدوري الأول في ألمانيا، يتميز بملاعبه الممتلئة وكرة القدم الهجومية. تابعوا الترتيب والمباريات.',
  },
  // Serie A
  135: {
    fr: "La Serie A est le championnat d'Italie, berceau du calcio et de clubs légendaires comme la Juventus, l'AC Milan et l'Inter.",
    en: "Serie A is Italy's top flight, the home of calcio and legendary clubs like Juventus, AC Milan, and Inter.",
    ar: 'الدوري الإيطالي هو الدوري الأول في إيطاليا، موطن كرة القدم الإيطالية وأندية أسطورية مثل يوفنتوس وميلان وإنتر.',
  },
  // Ligue 1
  61: {
    fr: 'La Ligue 1 est le championnat de France, avec le PSG en tête et de nombreux talents marocains évoluant dans ses clubs.',
    en: 'Ligue 1 is the French top flight, led by PSG and home to many Moroccan talents across its clubs.',
    ar: 'الدوري الفرنسي هو الدوري الأول في فرنسا، يتصدره باريس سان جيرمان ويضم العديد من المواهب المغربية.',
  },
  // Saudi Pro League
  307: {
    fr: 'La Saudi Pro League est le championnat professionnel saoudien, devenu un pôle mondial avec des transferts de stars internationales.',
    en: "The Saudi Pro League is Saudi Arabia's top division, now a global hub with major international signings.",
    ar: 'دوري المحترفين السعودي هو الدوري الأول في المملكة العربية السعودية، أصبح مركزاً عالمياً بانتقالات نجوم دوليين.',
  },
  // Egyptian Premier League
  233: {
    fr: "La Premier League égyptienne est le championnat d'Égypte, dominé par Al Ahly et Zamalek dans le derby du Caire.",
    en: "The Egyptian Premier League is Egypt's top division, dominated by Al Ahly and Zamalek in the Cairo derby.",
    ar: 'الدوري المصري الممتاز هو الدوري الأول في مصر، يهيمن عليه الأهلي والزمالك في ديربي القاهرة.',
  },
};

export function getLeagueIntro(competitionId: number, locale: Locale): string | null {
  return LEAGUE_INTROS[competitionId]?.[locale] ?? null;
}

// ── Country names ──

const COUNTRY_NAMES: Record<string, Record<Locale, string>> = {
  MA: { fr: 'Maroc', en: 'Morocco', ar: 'المغرب' },
  'GB-ENG': { fr: 'Angleterre', en: 'England', ar: 'إنجلترا' },
  ES: { fr: 'Espagne', en: 'Spain', ar: 'إسبانيا' },
  DE: { fr: 'Allemagne', en: 'Germany', ar: 'ألمانيا' },
  IT: { fr: 'Italie', en: 'Italy', ar: 'إيطاليا' },
  FR: { fr: 'France', en: 'France', ar: 'فرنسا' },
  SA: { fr: 'Arabie Saoudite', en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' },
  EG: { fr: 'Égypte', en: 'Egypt', ar: 'مصر' },
  PT: { fr: 'Portugal', en: 'Portugal', ar: 'البرتغال' },
  NL: { fr: 'Pays-Bas', en: 'Netherlands', ar: 'هولندا' },
  TR: { fr: 'Turquie', en: 'Turkey', ar: 'تركيا' },
  DZ: { fr: 'Algérie', en: 'Algeria', ar: 'الجزائر' },
  TN: { fr: 'Tunisie', en: 'Tunisia', ar: 'تونس' },
};

export function getLeagueCountryName(countryCode: string | null, locale: Locale): string | null {
  if (!countryCode) return null;
  return COUNTRY_NAMES[countryCode]?.[locale] ?? null;
}
