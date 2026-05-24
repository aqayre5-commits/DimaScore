/**
 * Club team name localization — Arabic and French for the 6 tracked leagues.
 *
 * Keyed by API-Football team ID.
 * Used by scripts/backfill-club-team-names.ts to populate teams.name and teams.short_name jsonb.
 *
 * Sources:
 * - Arabic: beIN Sports, Al Jazeera Sport, FIFA.com/ar conventions
 * - French: L'Equipe, FIFA.com/fr, established Moroccan French-language football media
 * - Short names: broadcast abbreviations used by beIN/Sky/DAZN
 */
export const CLUB_TEAM_NAMES: Record<
  number,
  {
    fr: string;
    ar: string;
    enShort: string;
    frShort?: string;
    arShort?: string;
  }
> = {
  // ─── Premier League (comp 39) ───

  42: { fr: 'Arsenal', ar: 'أرسنال', enShort: 'Arsenal' },
  66: { fr: 'Aston Villa', ar: 'أستون فيلا', enShort: 'Aston Villa' },
  35: { fr: 'Bournemouth', ar: 'بورنموث', enShort: 'Bournemouth' },
  55: { fr: 'Brentford', ar: 'برينتفورد', enShort: 'Brentford' },
  51: { fr: 'Brighton', ar: 'برايتون', enShort: 'Brighton' },
  44: { fr: 'Burnley', ar: 'بيرنلي', enShort: 'Burnley' },
  49: { fr: 'Chelsea', ar: 'تشيلسي', enShort: 'Chelsea' },
  52: { fr: 'Crystal Palace', ar: 'كريستال بالاس', enShort: 'Crystal Palace' },
  45: { fr: 'Everton', ar: 'إيفرتون', enShort: 'Everton' },
  36: { fr: 'Fulham', ar: 'فولهام', enShort: 'Fulham' },
  63: { fr: 'Leeds United', ar: 'ليدز يونايتد', enShort: 'Leeds' },
  40: { fr: 'Liverpool', ar: 'ليفربول', enShort: 'Liverpool' },
  50: {
    fr: 'Manchester City',
    ar: 'مانشستر سيتي',
    enShort: 'Man City',
    frShort: 'Man City',
    arShort: 'مان سيتي',
  },
  33: {
    fr: 'Manchester United',
    ar: 'مانشستر يونايتد',
    enShort: 'Man Utd',
    frShort: 'Man Utd',
    arShort: 'مان يونايتد',
  },
  34: { fr: 'Newcastle United', ar: 'نيوكاسل يونايتد', enShort: 'Newcastle', arShort: 'نيوكاسل' },
  65: {
    fr: 'Nottingham Forest',
    ar: 'نوتنغهام فورست',
    enShort: 'Nott. Forest',
    frShort: 'Nott. Forest',
    arShort: 'نوتنغهام',
  },
  746: { fr: 'Sunderland', ar: 'سندرلاند', enShort: 'Sunderland' },
  47: { fr: 'Tottenham Hotspur', ar: 'توتنهام هوتسبير', enShort: 'Tottenham', arShort: 'توتنهام' },
  48: { fr: 'West Ham United', ar: 'وست هام يونايتد', enShort: 'West Ham', arShort: 'وست هام' },
  39: {
    fr: 'Wolverhampton',
    ar: 'وولفرهامبتون',
    enShort: 'Wolves',
    frShort: 'Wolves',
    arShort: 'وولفز',
  },

  // ─── La Liga (comp 140) ───

  542: { fr: 'Alavés', ar: 'ألافيس', enShort: 'Alavés' },
  531: { fr: 'Athletic Club', ar: 'أتلتيك بيلباو', enShort: 'Athletic', arShort: 'أتلتيك' },
  530: {
    fr: 'Atlético Madrid',
    ar: 'أتلتيكو مدريد',
    enShort: 'Atlético',
    frShort: 'Atlético',
    arShort: 'أتلتيكو',
  },
  529: { fr: 'FC Barcelone', ar: 'برشلونة', enShort: 'Barcelona', frShort: 'Barcelone' },
  538: { fr: 'Celta Vigo', ar: 'سيلتا فيغو', enShort: 'Celta Vigo' },
  797: { fr: 'Elche', ar: 'إلتشي', enShort: 'Elche' },
  540: { fr: 'Espanyol', ar: 'إسبانيول', enShort: 'Espanyol' },
  546: { fr: 'Getafe', ar: 'خيتافي', enShort: 'Getafe' },
  547: { fr: 'Girona', ar: 'جيرونا', enShort: 'Girona' },
  539: { fr: 'Levante', ar: 'ليفانتي', enShort: 'Levante' },
  798: { fr: 'Majorque', ar: 'مايوركا', enShort: 'Mallorca', frShort: 'Majorque' },
  727: { fr: 'Osasuna', ar: 'أوساسونا', enShort: 'Osasuna' },
  718: { fr: 'Oviedo', ar: 'أوفييدو', enShort: 'Oviedo' },
  728: { fr: 'Rayo Vallecano', ar: 'رايو فاييكانو', enShort: 'Rayo', arShort: 'رايو' },
  543: { fr: 'Real Betis', ar: 'ريال بيتيس', enShort: 'Real Betis', arShort: 'بيتيس' },
  541: { fr: 'Real Madrid', ar: 'ريال مدريد', enShort: 'Real Madrid' },
  548: { fr: 'Real Sociedad', ar: 'ريال سوسيداد', enShort: 'Real Sociedad', arShort: 'سوسيداد' },
  536: { fr: 'Séville', ar: 'إشبيلية', enShort: 'Sevilla', frShort: 'Séville' },
  532: { fr: 'Valence', ar: 'فالنسيا', enShort: 'Valencia', frShort: 'Valence' },
  533: { fr: 'Villarreal', ar: 'فياريال', enShort: 'Villarreal' },

  // ─── Bundesliga (comp 78) ───

  180: { fr: '1. FC Heidenheim', ar: 'هايدنهايم', enShort: 'Heidenheim' },
  192: { fr: 'FC Cologne', ar: 'كولن', enShort: 'Köln', frShort: 'Cologne' },
  167: { fr: '1899 Hoffenheim', ar: 'هوفنهايم', enShort: 'Hoffenheim' },
  168: { fr: 'Bayer Leverkusen', ar: 'باير ليفركوزن', enShort: 'Leverkusen', arShort: 'ليفركوزن' },
  157: { fr: 'Bayern Munich', ar: 'بايرن ميونخ', enShort: 'Bayern', arShort: 'بايرن' },
  165: {
    fr: 'Borussia Dortmund',
    ar: 'بوروسيا دورتموند',
    enShort: 'Dortmund',
    frShort: 'Dortmund',
    arShort: 'دورتموند',
  },
  163: {
    fr: 'Borussia Mönchengladbach',
    ar: 'بوروسيا مونشنغلادباخ',
    enShort: "M'gladbach",
    frShort: "M'gladbach",
    arShort: 'غلادباخ',
  },
  169: {
    fr: 'Eintracht Francfort',
    ar: 'آينتراخت فرانكفورت',
    enShort: 'Frankfurt',
    frShort: 'Francfort',
    arShort: 'فرانكفورت',
  },
  170: { fr: 'FC Augsbourg', ar: 'أوغسبورغ', enShort: 'Augsburg', frShort: 'Augsbourg' },
  186: { fr: 'FC St. Pauli', ar: 'سانت باولي', enShort: 'St. Pauli' },
  164: { fr: 'FSV Mayence 05', ar: 'ماينتس', enShort: 'Mainz', frShort: 'Mayence' },
  175: { fr: 'Hambourg SV', ar: 'هامبورغ', enShort: 'Hamburg', frShort: 'Hambourg' },
  173: { fr: 'RB Leipzig', ar: 'لايبزيغ', enShort: 'Leipzig', arShort: 'لايبزيغ' },
  160: { fr: 'SC Fribourg', ar: 'فرايبورغ', enShort: 'Freiburg', frShort: 'Fribourg' },
  182: { fr: 'Union Berlin', ar: 'أونيون برلين', enShort: 'Union Berlin' },
  172: { fr: 'VfB Stuttgart', ar: 'شتوتغارت', enShort: 'Stuttgart' },
  161: { fr: 'VfL Wolfsbourg', ar: 'فولفسبورغ', enShort: 'Wolfsburg', frShort: 'Wolfsbourg' },
  162: {
    fr: 'Werder Brême',
    ar: 'فيردر بريمن',
    enShort: 'Bremen',
    frShort: 'Brême',
    arShort: 'بريمن',
  },

  // ─── Serie A (comp 135) ───

  489: { fr: 'AC Milan', ar: 'ميلان', enShort: 'Milan' },
  497: { fr: 'AS Roma', ar: 'روما', enShort: 'Roma' },
  499: { fr: 'Atalanta', ar: 'أتالانتا', enShort: 'Atalanta' },
  500: { fr: 'Bologne', ar: 'بولونيا', enShort: 'Bologna', frShort: 'Bologne' },
  490: { fr: 'Cagliari', ar: 'كالياري', enShort: 'Cagliari' },
  895: { fr: 'Côme', ar: 'كومو', enShort: 'Como', frShort: 'Côme' },
  520: { fr: 'Cremonese', ar: 'كريمونيزي', enShort: 'Cremonese' },
  502: { fr: 'Fiorentina', ar: 'فيورنتينا', enShort: 'Fiorentina' },
  495: { fr: 'Gênes', ar: 'جنوى', enShort: 'Genoa', frShort: 'Gênes' },
  504: {
    fr: 'Hellas Vérone',
    ar: 'هيلاس فيرونا',
    enShort: 'Verona',
    frShort: 'Vérone',
    arShort: 'فيرونا',
  },
  505: { fr: 'Inter Milan', ar: 'إنتر ميلان', enShort: 'Inter' },
  496: { fr: 'Juventus', ar: 'يوفنتوس', enShort: 'Juventus' },
  487: { fr: 'Lazio', ar: 'لاتسيو', enShort: 'Lazio' },
  867: { fr: 'Lecce', ar: 'ليتشي', enShort: 'Lecce' },
  492: { fr: 'Naples', ar: 'نابولي', enShort: 'Napoli', frShort: 'Naples' },
  523: { fr: 'Parme', ar: 'بارما', enShort: 'Parma', frShort: 'Parme' },
  801: { fr: 'Pise', ar: 'بيزا', enShort: 'Pisa', frShort: 'Pise' },
  488: { fr: 'Sassuolo', ar: 'ساسولو', enShort: 'Sassuolo' },
  503: { fr: 'Turin', ar: 'تورينو', enShort: 'Torino', frShort: 'Turin' },
  494: { fr: 'Udinese', ar: 'أودينيزي', enShort: 'Udinese' },

  // ─── Ligue 1 (comp 61) ───

  77: { fr: 'Angers SCO', ar: 'أنجيه', enShort: 'Angers' },
  108: { fr: 'AJ Auxerre', ar: 'أوكسير', enShort: 'Auxerre' },
  111: { fr: 'Le Havre AC', ar: 'لو هافر', enShort: 'Le Havre' },
  116: { fr: 'RC Lens', ar: 'لانس', enShort: 'Lens' },
  79: { fr: 'LOSC Lille', ar: 'ليل', enShort: 'Lille' },
  97: { fr: 'FC Lorient', ar: 'لوريان', enShort: 'Lorient' },
  80: { fr: 'Olympique Lyonnais', ar: 'ليون', enShort: 'Lyon', frShort: 'Lyon' },
  81: {
    fr: 'Olympique de Marseille',
    ar: 'مارسيليا',
    enShort: 'Marseille',
    frShort: 'Marseille',
    arShort: 'مارسيليا',
  },
  112: { fr: 'FC Metz', ar: 'ميتز', enShort: 'Metz' },
  91: { fr: 'AS Monaco', ar: 'موناكو', enShort: 'Monaco' },
  83: { fr: 'FC Nantes', ar: 'نانت', enShort: 'Nantes' },
  84: { fr: 'OGC Nice', ar: 'نيس', enShort: 'Nice' },
  114: { fr: 'Paris FC', ar: 'باريس إف سي', enShort: 'Paris FC' },
  85: {
    fr: 'Paris Saint-Germain',
    ar: 'باريس سان جيرمان',
    enShort: 'PSG',
    frShort: 'PSG',
    arShort: 'باريس',
  },
  94: { fr: 'Stade Rennais', ar: 'رين', enShort: 'Rennes', frShort: 'Rennes' },
  106: {
    fr: 'Stade Brestois 29',
    ar: 'ستاد بريست',
    enShort: 'Brest',
    frShort: 'Brest',
    arShort: 'بريست',
  },
  95: { fr: 'RC Strasbourg', ar: 'ستراسبورغ', enShort: 'Strasbourg' },
  96: { fr: 'Toulouse FC', ar: 'تولوز', enShort: 'Toulouse' },

  // ─── Botola Pro (comp 200) ───

  22218: { fr: 'CODM Meknès', ar: 'نادي مكناس', enShort: 'CODM' },
  3449: {
    fr: 'CR Khemis Zemamra',
    ar: 'نهضة خميس الزمامرة',
    enShort: 'CRKZ',
    frShort: 'Khemis Z.',
    arShort: 'خميس الزمامرة',
  },
  964: {
    fr: 'Difaa El Jadida',
    ar: 'الدفاع الحسني الجديدي',
    enShort: 'DHJ',
    frShort: 'DHJ',
    arShort: 'الدفاع الجديدي',
  },
  969: { fr: 'AS FAR', ar: 'الجيش الملكي', enShort: 'AS FAR', frShort: 'AS FAR' },
  977: { fr: 'FUS Rabat', ar: 'الفتح الرباطي', enShort: 'FUS', arShort: 'الفتح' },
  973: { fr: 'Hassania Agadir', ar: 'حسنية أكادير', enShort: 'HUSA', arShort: 'حسنية' },
  974: { fr: 'Ittihad Tanger', ar: 'اتحاد طنجة', enShort: 'IRT', arShort: 'اتحاد طنجة' },
  971: { fr: 'Kawkab Marrakech', ar: 'الكوكب المراكشي', enShort: 'KACM', arShort: 'الكوكب' },
  3453: { fr: 'Maghreb de Fès', ar: 'المغرب الفاسي', enShort: 'MAS', arShort: 'المغرب الفاسي' },
  3454: { fr: 'Olympique Dcheïra', ar: 'أولمبيك الدشيرة', enShort: 'OD', arShort: 'الدشيرة' },
  975: { fr: 'Olympique de Safi', ar: 'أولمبيك آسفي', enShort: 'OCS', arShort: 'آسفي' },
  976: { fr: 'Raja Casablanca', ar: 'الرجاء البيضاوي', enShort: 'Raja', arShort: 'الرجاء' },
  962: { fr: 'Renaissance de Berkane', ar: 'نهضة بركان', enShort: 'RSB', arShort: 'بركان' },
  14806: { fr: 'UTS Rabat', ar: 'الاتحاد الرياضي لطنجة الرباط', enShort: 'UTS', arShort: 'UTS' },
  968: { fr: 'Wydad Athletic Club', ar: 'الوداد الرياضي', enShort: 'WAC', arShort: 'الوداد' },
  25058: { fr: 'Yacoub El Mansour', ar: 'يعقوب المنصور', enShort: 'YEM' },
};
