import type { Locale } from '@/lib/i18n/config';

// ── League about content ────────────────────────────────────────────────────
// Rich descriptions and key facts for league competition pages.
// Keyed by API-Football competition ID.

export interface LeagueAboutEntry {
  description: Record<Locale, string>;
  facts: {
    labelKey: string; // i18n key under 'leaguePage'
    value: Record<Locale, string>;
  }[];
}

const LEAGUE_ABOUT: Record<number, LeagueAboutEntry> = {
  // ── Premier League (39) ───────────────────────────────────────────────────
  39: {
    description: {
      en: "Founded in 1992 after the top clubs broke away from the Football League First Division, the Premier League has grown into the most-watched domestic football competition on the planet. Twenty clubs compete in a full home-and-away season of 380 matches, with the bottom three relegated to the Championship each year. The league's global broadcast reach spans over 180 countries, generating intense competition for European qualification spots and survival alike.",
      fr: "Créée en 1992 après la scission des clubs de l'élite avec la Football League First Division, la Premier League est devenue la compétition domestique la plus suivie au monde. Vingt clubs disputent un championnat aller-retour de 380 matchs, les trois derniers étant relégués en Championship. Sa diffusion mondiale touche plus de 180 pays, alimentant une course acharnée pour les places européennes comme pour le maintien.",
      ar: 'تأسس الدوري الإنجليزي الممتاز عام 1992 بعد انفصال أندية القمة عن دوري الدرجة الأولى، وأصبح أكثر بطولة محلية مشاهدة في العالم. يتنافس عشرون ناديًا في موسم كامل ذهابًا وإيابًا من 380 مباراة، يهبط آخر ثلاثة إلى بطولة الدرجة الثانية. تصل تغطيته التلفزيونية إلى أكثر من 180 دولة، مما يشعل المنافسة على المراكز الأوروبية والبقاء على حد سواء.',
    },
    facts: [
      { labelKey: 'founded', value: { en: '1992', fr: '1992', ar: '1992' } },
      { labelKey: 'country', value: { en: 'England', fr: 'Angleterre', ar: 'إنجلترا' } },
      { labelKey: 'teams', value: { en: '20', fr: '20', ar: '20' } },
      {
        labelKey: 'governingBody',
        value: {
          en: 'The FA / Premier League Ltd',
          fr: 'The FA / Premier League Ltd',
          ar: 'الاتحاد الإنجليزي / شركة الدوري الممتاز',
        },
      },
      {
        labelKey: 'promotion',
        value: {
          en: '3 from Championship',
          fr: '3 depuis le Championship',
          ar: '3 من بطولة الدرجة الثانية',
        },
      },
      {
        labelKey: 'relegation',
        value: {
          en: '3 to Championship',
          fr: '3 vers le Championship',
          ar: '3 إلى بطولة الدرجة الثانية',
        },
      },
    ],
  },

  // ── FA Women's Super League (44) ──────────────────────────────────────────
  44: {
    description: {
      en: "The FA Women's Super League sits at the apex of English women's football. Launched in 2011 as a semi-professional summer league, it transitioned to a fully professional winter calendar in 2018 and has since attracted record investment and attendances. Twelve clubs contest 22 matchdays, with the title race regularly featuring Chelsea, Arsenal, and Manchester City.",
      fr: "La FA Women's Super League est le sommet du football féminin anglais. Lancée en 2011 comme ligue semi-professionnelle estivale, elle est passée à un calendrier hivernal entièrement professionnel en 2018, attirant des investissements et des affluences records. Douze clubs disputent 22 journées, le titre se jouant régulièrement entre Chelsea, Arsenal et Manchester City.",
      ar: 'يقع الدوري الإنجليزي الممتاز للسيدات على قمة كرة القدم النسائية الإنجليزية. انطلق عام 2011 كدوري شبه احترافي صيفي، ثم تحول إلى بطولة شتوية احترافية بالكامل في 2018، مستقطبًا استثمارات وحضورًا قياسيًا. يتنافس اثنا عشر ناديًا في 22 جولة، مع صراع مستمر على اللقب بين تشيلسي وأرسنال ومانشستر سيتي.',
    },
    facts: [
      { labelKey: 'founded', value: { en: '2011', fr: '2011', ar: '2011' } },
      { labelKey: 'country', value: { en: 'England', fr: 'Angleterre', ar: 'إنجلترا' } },
      { labelKey: 'teams', value: { en: '12', fr: '12', ar: '12' } },
      {
        labelKey: 'governingBody',
        value: {
          en: 'The Football Association',
          fr: 'The Football Association',
          ar: 'الاتحاد الإنجليزي لكرة القدم',
        },
      },
      {
        labelKey: 'relegation',
        value: {
          en: '1 to Championship',
          fr: '1 vers le Championship',
          ar: '1 إلى بطولة الدرجة الثانية',
        },
      },
    ],
  },

  // ── Ligue 1 France (61) ───────────────────────────────────────────────────
  61: {
    description: {
      en: "Ligue 1 is the top tier of French club football, operating since 1932 under the Ligue de Football Professionnel. Eighteen clubs play a 306-match season, with the league serving as a prolific nursery for global talent — from Platini and Zidane to the Moroccan internationals who regularly feature across its rosters. Paris Saint-Germain's financial muscle has reshaped the title race, though competition from Lyon, Marseille, and Monaco keeps the league unpredictable.",
      fr: "La Ligue 1 est l'élite du football français, organisée depuis 1932 par la Ligue de Football Professionnel. Dix-huit clubs disputent une saison de 306 matchs. Véritable vivier de talents mondiaux — de Platini et Zidane aux internationaux marocains présents dans de nombreux effectifs — le championnat a été transformé par la puissance financière du Paris Saint-Germain, tandis que Lyon, Marseille et Monaco maintiennent l'incertitude.",
      ar: 'الدوري الفرنسي هو قمة كرة القدم الفرنسية، ينظمه الاتحاد المهني منذ 1932. يتنافس ثمانية عشر ناديًا في موسم من 306 مباريات. يُعد الدوري مصنعًا للمواهب العالمية من بلاتيني وزيدان إلى اللاعبين المغاربة المنتشرين في صفوف أنديته. أعادت القوة المالية لباريس سان جيرمان تشكيل سباق اللقب، لكن ليون ومرسيليا وموناكو يحافظون على عنصر المفاجأة.',
    },
    facts: [
      { labelKey: 'founded', value: { en: '1932', fr: '1932', ar: '1932' } },
      { labelKey: 'country', value: { en: 'France', fr: 'France', ar: 'فرنسا' } },
      { labelKey: 'teams', value: { en: '18', fr: '18', ar: '18' } },
      {
        labelKey: 'governingBody',
        value: {
          en: 'LFP (Ligue de Football Professionnel)',
          fr: 'LFP (Ligue de Football Professionnel)',
          ar: 'الرابطة المهنية لكرة القدم الفرنسية',
        },
      },
      {
        labelKey: 'promotion',
        value: {
          en: '2 from Ligue 2',
          fr: '2 depuis la Ligue 2',
          ar: '2 من الدوري الفرنسي الثاني',
        },
      },
      {
        labelKey: 'relegation',
        value: {
          en: '2 to Ligue 2 + 1 playoff',
          fr: '2 vers la Ligue 2 + 1 barrage',
          ar: '2 إلى الدوري الثاني + 1 ملحق',
        },
      },
    ],
  },

  // ── Bundesliga (78) ───────────────────────────────────────────────────────
  78: {
    description: {
      en: "The Bundesliga has been German football's top division since 1963 and consistently leads Europe in stadium attendance, with an average exceeding 42,000 per match. Eighteen clubs compete across 34 matchdays in a single-table format. Bayern Munich's sustained dominance is a defining narrative, yet Borussia Dortmund, Bayer Leverkusen, and RB Leipzig have each mounted serious title bids in recent seasons, reflecting the league's growing parity.",
      fr: "La Bundesliga est la première division du football allemand depuis 1963 et domine l'Europe en termes d'affluence, avec une moyenne dépassant 42 000 spectateurs par match. Dix-huit clubs s'affrontent sur 34 journées en poule unique. La domination de longue date du Bayern Munich définit le championnat, mais le Borussia Dortmund, le Bayer Leverkusen et le RB Leipzig ont chacun lancé de sérieuses courses au titre, signe d'un rééquilibrage progressif.",
      ar: 'البوندسليغا هو دوري الدرجة الأولى الألماني منذ 1963 ويتصدر أوروبا في حضور الجماهير بمعدل يتجاوز 42,000 متفرج لكل مباراة. يتنافس ثمانية عشر ناديًا في 34 جولة بنظام المجموعة الواحدة. هيمنة بايرن ميونخ المتواصلة هي السمة الأبرز، لكن بوروسيا دورتموند وباير ليفركوزن ولايبزيغ نافسوا بجدية على اللقب مؤخرًا مما يعكس تنافسية متزايدة.',
    },
    facts: [
      { labelKey: 'founded', value: { en: '1963', fr: '1963', ar: '1963' } },
      { labelKey: 'country', value: { en: 'Germany', fr: 'Allemagne', ar: 'ألمانيا' } },
      { labelKey: 'teams', value: { en: '18', fr: '18', ar: '18' } },
      {
        labelKey: 'governingBody',
        value: {
          en: 'DFL (Deutsche Fußball Liga)',
          fr: 'DFL (Deutsche Fußball Liga)',
          ar: 'رابطة الدوري الألماني لكرة القدم',
        },
      },
      {
        labelKey: 'promotion',
        value: {
          en: '2 from 2. Bundesliga + 1 playoff',
          fr: '2 depuis la 2. Bundesliga + 1 barrage',
          ar: '2 من الدرجة الثانية + 1 ملحق',
        },
      },
      {
        labelKey: 'relegation',
        value: {
          en: '2 to 2. Bundesliga + 1 playoff',
          fr: '2 vers la 2. Bundesliga + 1 barrage',
          ar: '2 إلى الدرجة الثانية + 1 ملحق',
        },
      },
    ],
  },

  // ── Frauen Bundesliga (82) ────────────────────────────────────────────────
  82: {
    description: {
      en: "The Frauen Bundesliga is Germany's premier women's football league, established in 1990. Twelve teams play a 22-matchday season. VfL Wolfsburg and Bayern Munich have shared the majority of recent titles, while clubs like Eintracht Frankfurt and SGS Essen remain competitive. The league has benefited from growing media coverage and the success of the German women's national team on the world stage.",
      fr: "La Frauen Bundesliga est la première division féminine allemande, fondée en 1990. Douze équipes disputent 22 journées. Le VfL Wolfsburg et le Bayern Munich se partagent la majorité des titres récents, tandis que l'Eintracht Francfort et le SGS Essen restent compétitifs. Le championnat bénéficie d'une couverture médiatique croissante et des succès de la sélection féminine allemande sur la scène internationale.",
      ar: 'دوري الدرجة الأولى الألماني للسيدات هو أعلى مسابقة في كرة القدم النسائية الألمانية، تأسس عام 1990. تتنافس اثنتا عشرة فرقة في 22 جولة. يتقاسم فولفسبورغ وبايرن ميونخ معظم الألقاب الأخيرة، بينما يحافظ آينتراخت فرانكفورت وإيسن على تنافسيتهما. يستفيد الدوري من تغطية إعلامية متنامية ونجاحات المنتخب الألماني النسائي عالميًا.',
    },
    facts: [
      { labelKey: 'founded', value: { en: '1990', fr: '1990', ar: '1990' } },
      { labelKey: 'country', value: { en: 'Germany', fr: 'Allemagne', ar: 'ألمانيا' } },
      { labelKey: 'teams', value: { en: '12', fr: '12', ar: '12' } },
      {
        labelKey: 'governingBody',
        value: {
          en: 'DFB (Deutscher Fußball-Bund)',
          fr: 'DFB (Deutscher Fußball-Bund)',
          ar: 'الاتحاد الألماني لكرة القدم',
        },
      },
      {
        labelKey: 'relegation',
        value: {
          en: '2 to 2. Frauen-Bundesliga',
          fr: '2 vers la 2. Frauen-Bundesliga',
          ar: '2 إلى الدرجة الثانية للسيدات',
        },
      },
    ],
  },

  // ── Serie A (135) ─────────────────────────────────────────────────────────
  135: {
    description: {
      en: "Serie A is the pinnacle of Italian football, tracing its roots to 1898 and its current round-robin format to 1929. Twenty clubs play 380 matches per season. Historically celebrated for tactical sophistication and defensive solidity, the league has produced some of football's most iconic rivalries — Juventus vs. Inter, Milan vs. Roma — and continues to attract top talent from across the globe.",
      fr: "La Serie A est le sommet du football italien, dont les origines remontent à 1898 et le format actuel en poule unique à 1929. Vingt clubs disputent 380 matchs par saison. Historiquement célébré pour sa sophistication tactique et sa solidité défensive, le championnat a produit des rivalités emblématiques — Juventus-Inter, Milan-Roma — et continue d'attirer les meilleurs talents du monde.",
      ar: 'الدوري الإيطالي هو قمة كرة القدم الإيطالية، تعود جذوره إلى 1898 ونظامه الحالي للمجموعة الواحدة إلى 1929. يتنافس عشرون ناديًا في 380 مباراة كل موسم. يُشتهر بتكتيكاته المتقدمة وصلابته الدفاعية، وأنتج أبرز الديربيات في تاريخ اللعبة مثل يوفنتوس ضد إنتر وميلان ضد روما، ولا يزال يستقطب أفضل اللاعبين من مختلف أنحاء العالم.',
    },
    facts: [
      {
        labelKey: 'founded',
        value: {
          en: '1898 (current format 1929)',
          fr: '1898 (format actuel 1929)',
          ar: '1898 (الصيغة الحالية 1929)',
        },
      },
      { labelKey: 'country', value: { en: 'Italy', fr: 'Italie', ar: 'إيطاليا' } },
      { labelKey: 'teams', value: { en: '20', fr: '20', ar: '20' } },
      {
        labelKey: 'governingBody',
        value: {
          en: 'FIGC / Lega Serie A',
          fr: 'FIGC / Lega Serie A',
          ar: 'الاتحاد الإيطالي / رابطة الدوري الإيطالي',
        },
      },
      {
        labelKey: 'promotion',
        value: { en: '3 from Serie B', fr: '3 depuis la Serie B', ar: '3 من الدرجة الثانية' },
      },
      {
        labelKey: 'relegation',
        value: { en: '3 to Serie B', fr: '3 vers la Serie B', ar: '3 إلى الدرجة الثانية' },
      },
    ],
  },

  // ── Serie A Women (139) ───────────────────────────────────────────────────
  139: {
    description: {
      en: "Serie A Femminile is Italy's top women's football division, fully professional since the 2022-23 season. Ten clubs play an 18-matchday campaign. Juventus Women have dominated the early professional era, while Roma and Fiorentina have emerged as regular contenders. The league is part of a broader push by the FIGC to develop women's football following Italy's strong performances at the Women's World Cup.",
      fr: "La Serie A Femminile est la première division féminine italienne, entièrement professionnelle depuis la saison 2022-23. Dix clubs disputent 18 journées. La Juventus Women domine l'ère professionnelle naissante, tandis que la Roma et la Fiorentina s'imposent comme des prétendantes régulières. Le championnat s'inscrit dans la volonté de la FIGC de développer le football féminin après les bonnes prestations de l'Italie en Coupe du Monde.",
      ar: 'الدوري الإيطالي للسيدات هو أعلى درجة في كرة القدم النسائية الإيطالية، أصبح احترافيًا بالكامل منذ موسم 2022-23. تتنافس عشرة أندية في 18 جولة. تهيمن سيدات يوفنتوس على المرحلة الاحترافية الأولى، فيما برزت روما وفيورنتينا كمنافسات دائمات. يأتي الدوري ضمن مساعي الاتحاد الإيطالي لتطوير كرة القدم النسائية بعد الأداء القوي لإيطاليا في كأس العالم للسيدات.',
    },
    facts: [
      {
        labelKey: 'founded',
        value: {
          en: '2018 (professional since 2022)',
          fr: '2018 (professionnel depuis 2022)',
          ar: '2018 (احترافي منذ 2022)',
        },
      },
      { labelKey: 'country', value: { en: 'Italy', fr: 'Italie', ar: 'إيطاليا' } },
      { labelKey: 'teams', value: { en: '10', fr: '10', ar: '10' } },
      {
        labelKey: 'governingBody',
        value: {
          en: 'FIGC / Divisione Calcio Femminile',
          fr: 'FIGC / Divisione Calcio Femminile',
          ar: 'الاتحاد الإيطالي / شعبة كرة القدم النسائية',
        },
      },
    ],
  },

  // ── La Liga (140) ─────────────────────────────────────────────────────────
  140: {
    description: {
      en: "La Liga has shaped world football since 1929, producing a record number of Ballon d'Or winners and some of the sport's most technically gifted players. Twenty clubs play 380 matches across 38 matchdays. While Real Madrid and FC Barcelona have historically dominated, clubs like Atlético Madrid, Real Sociedad, and Athletic Bilbao regularly challenge for European spots, and the league's emphasis on technical skill and possession remains its global calling card.",
      fr: "La Liga façonne le football mondial depuis 1929, produisant un nombre record de lauréats du Ballon d'Or et des joueurs parmi les plus doués techniquement. Vingt clubs disputent 380 matchs sur 38 journées. Si le Real Madrid et le FC Barcelone dominent historiquement, l'Atlético de Madrid, la Real Sociedad et l'Athletic Bilbao rivalisent régulièrement pour les places européennes. L'accent mis sur la technique et la possession reste la marque distinctive du championnat.",
      ar: 'يشكّل الدوري الإسباني كرة القدم العالمية منذ 1929، منتجًا عددًا قياسيًا من الفائزين بالكرة الذهبية وأكثر اللاعبين موهبة في تاريخ اللعبة. يتنافس عشرون ناديًا في 380 مباراة على 38 جولة. ورغم هيمنة ريال مدريد وبرشلونة التاريخية، ينافس أتلتيكو مدريد وريال سوسيداد وأتلتيك بيلباو بانتظام على المراكز الأوروبية. يبقى التركيز على المهارة والاستحواذ السمة المميزة للدوري عالميًا.',
    },
    facts: [
      { labelKey: 'founded', value: { en: '1929', fr: '1929', ar: '1929' } },
      { labelKey: 'country', value: { en: 'Spain', fr: 'Espagne', ar: 'إسبانيا' } },
      { labelKey: 'teams', value: { en: '20', fr: '20', ar: '20' } },
      {
        labelKey: 'governingBody',
        value: { en: 'RFEF / LaLiga', fr: 'RFEF / LaLiga', ar: 'الاتحاد الإسباني / لاليغا' },
      },
      {
        labelKey: 'promotion',
        value: {
          en: '3 from La Liga 2',
          fr: '3 depuis La Liga 2',
          ar: '3 من الدوري الإسباني الثاني',
        },
      },
      {
        labelKey: 'relegation',
        value: { en: '3 to La Liga 2', fr: '3 vers La Liga 2', ar: '3 إلى الدوري الإسباني الثاني' },
      },
    ],
  },

  // ── Primera División Femenina / Liga F (142) ──────────────────────────────
  142: {
    description: {
      en: "Liga F, Spain's top women's football division, became fully professional in 2022 under its own governing structure. Sixteen clubs play 30 matchdays per season. FC Barcelona Femení have established an era of dominance with consecutive Champions League titles, while Real Madrid CFF and Atlético Madrid have invested heavily to close the gap. The league benefits from strong grassroots development and record broadcast deals.",
      fr: "La Liga F, première division féminine espagnole, est devenue entièrement professionnelle en 2022 avec sa propre gouvernance. Seize clubs disputent 30 journées par saison. Le FC Barcelone Féminin a instauré une ère de domination avec des titres consécutifs en Ligue des Champions, tandis que le Real Madrid CFF et l'Atlético investissent massivement pour combler l'écart. Le championnat profite d'un solide développement de base et de droits TV records.",
      ar: 'أصبح الدوري الإسباني للسيدات (ليغا إف) محترفًا بالكامل عام 2022 بهيكل إداري مستقل. تتنافس ستة عشر ناديًا في 30 جولة كل موسم. فرض برشلونة للسيدات حقبة هيمنة بألقاب متتالية في دوري أبطال أوروبا، فيما يستثمر ريال مدريد وأتلتيكو بكثافة لتقليص الفجوة. يستفيد الدوري من قاعدة شبابية قوية وعقود بث قياسية.',
    },
    facts: [
      {
        labelKey: 'founded',
        value: {
          en: '1988 (professional since 2022)',
          fr: '1988 (professionnel depuis 2022)',
          ar: '1988 (احترافي منذ 2022)',
        },
      },
      { labelKey: 'country', value: { en: 'Spain', fr: 'Espagne', ar: 'إسبانيا' } },
      { labelKey: 'teams', value: { en: '16', fr: '16', ar: '16' } },
      {
        labelKey: 'governingBody',
        value: { en: 'RFEF / Liga F', fr: 'RFEF / Liga F', ar: 'الاتحاد الإسباني / ليغا إف' },
      },
    ],
  },

  // ── Ligue 1 Algeria (186) ─────────────────────────────────────────────────
  186: {
    description: {
      en: "The Ligue 1 Professionnelle is Algeria's highest football division, managed by the Ligue de Football Professionnel under the Algerian FA. Sixteen clubs compete across 30 matchdays each season. The rivalry between JS Kabylie, MC Alger, USM Alger, and CR Belouizdad drives passionate support in stadiums across the country. The league has long served as a feeder for the Algerian national team and European clubs, particularly in France.",
      fr: "La Ligue 1 Professionnelle est la plus haute division du football algérien, gérée par la Ligue de Football Professionnel sous l'égide de la FAF. Seize clubs s'affrontent sur 30 journées par saison. La rivalité entre la JS Kabylie, le MC Alger, l'USM Alger et le CR Belouizdad génère une passion intense dans les stades du pays. Le championnat est depuis longtemps un vivier pour la sélection algérienne et les clubs européens, notamment français.",
      ar: 'الدوري الجزائري المحترف هو أعلى مسابقة كروية في الجزائر، تديره الرابطة المهنية تحت إشراف الاتحاد الجزائري. يتنافس ستة عشر ناديًا في 30 جولة كل موسم. تغذي المنافسة بين شبيبة القبائل ومولودية الجزائر واتحاد العاصمة وشباب بلوزداد حماسًا جماهيريًا كبيرًا. يظل الدوري رافدًا أساسيًا للمنتخب الجزائري والأندية الأوروبية لا سيما الفرنسية.',
    },
    facts: [
      { labelKey: 'founded', value: { en: '1962', fr: '1962', ar: '1962' } },
      { labelKey: 'country', value: { en: 'Algeria', fr: 'Algérie', ar: 'الجزائر' } },
      { labelKey: 'teams', value: { en: '16', fr: '16', ar: '16' } },
      {
        labelKey: 'governingBody',
        value: { en: 'FAF / LFP', fr: 'FAF / LFP', ar: 'الاتحاد الجزائري / الرابطة المهنية' },
      },
      {
        labelKey: 'relegation',
        value: { en: '3 to Ligue 2', fr: '3 vers la Ligue 2', ar: '3 إلى الدرجة الثانية' },
      },
    ],
  },

  // ── Botola Pro (200) ──────────────────────────────────────────────────────
  200: {
    description: {
      en: "The Botola Pro Inwi is Morocco's premier football league, organized by the LNFP under the FRMF. Sixteen clubs play a full 30-matchday season. The rivalry between Wydad AC and Raja CA — the Casablanca derby — is one of Africa's most intense, while AS FAR, FUS Rabat, and Renaissance de Berkane have all lifted the title in recent years. The league is a key supplier of talent to the Moroccan national team and to European and Gulf clubs.",
      fr: "La Botola Pro Inwi est le championnat de football de première division du Maroc, organisé par la LNFP sous l'égide de la FRMF. Seize clubs disputent une saison complète de 30 journées. La rivalité entre le Wydad AC et le Raja CA — le derby casablancais — est l'un des plus intenses d'Afrique, tandis que l'AS FAR, le FUS Rabat et la Renaissance de Berkane ont tous soulevé le titre récemment. Le championnat est un vivier majeur pour les Lions de l'Atlas et les clubs européens et du Golfe.",
      ar: 'البطولة الاحترافية إنوي هي دوري الدرجة الأولى المغربي، ينظمها العصبة الوطنية تحت إشراف الجامعة الملكية المغربية. يتنافس ستة عشر ناديًا في 30 جولة. تعد مواجهة الوداد والرجاء — ديربي الدار البيضاء — من أشد الديربيات في أفريقيا، بينما توّج الجيش الملكي والفتح الرباطي ونهضة بركان باللقب في السنوات الأخيرة. يبقى الدوري رافدًا أساسيًا لأسود الأطلس وللأندية الأوروبية والخليجية.',
    },
    facts: [
      { labelKey: 'founded', value: { en: '1956', fr: '1956', ar: '1956' } },
      { labelKey: 'country', value: { en: 'Morocco', fr: 'Maroc', ar: 'المغرب' } },
      { labelKey: 'teams', value: { en: '16', fr: '16', ar: '16' } },
      {
        labelKey: 'governingBody',
        value: { en: 'FRMF / LNFP', fr: 'FRMF / LNFP', ar: 'الجامعة الملكية / العصبة الوطنية' },
      },
      {
        labelKey: 'promotion',
        value: { en: '2 from Botola 2', fr: '2 depuis la Botola 2', ar: '2 من القسم الثاني' },
      },
      {
        labelKey: 'relegation',
        value: { en: '2 to Botola 2', fr: '2 vers la Botola 2', ar: '2 إلى القسم الثاني' },
      },
    ],
  },

  // ── Botola 2 (201) ────────────────────────────────────────────────────────
  201: {
    description: {
      en: "The Botola 2 is Morocco's second-tier professional football league, serving as the pathway to the Botola Pro. Sixteen clubs compete across 30 matchdays, with the top two earning automatic promotion. The division features a mix of ambitious clubs pushing for top-flight status and established names rebuilding after relegation. Clubs like Difaâ El Jadida, Chabab Mohammedia, and Olympique de Khouribga frequently contest promotion.",
      fr: "La Botola 2 est la deuxième division professionnelle du football marocain, voie d'accès vers la Botola Pro. Seize clubs disputent 30 journées, les deux premiers obtenant une promotion directe. La division mêle des clubs ambitieux visant l'élite et des noms établis en reconstruction après une relégation. Le Difaâ El Jadida, le Chabab Mohammédia et l'Olympique de Khouribga sont régulièrement dans la course à la montée.",
      ar: 'القسم الثاني هو ثاني أعلى درجة احترافية في كرة القدم المغربية ويمثل البوابة نحو البطولة الاحترافية. يتنافس ستة عشر ناديًا في 30 جولة، يصعد أول ناديين مباشرة. يجمع القسم بين أندية طموحة تسعى للصعود وأسماء عريقة تعيد بناء نفسها بعد الهبوط. الدفاع الجديدي وشباب المحمدية وأولمبيك خريبكة من أبرز المتنافسين على الصعود.',
    },
    facts: [
      { labelKey: 'founded', value: { en: '1956', fr: '1956', ar: '1956' } },
      { labelKey: 'country', value: { en: 'Morocco', fr: 'Maroc', ar: 'المغرب' } },
      { labelKey: 'teams', value: { en: '16', fr: '16', ar: '16' } },
      {
        labelKey: 'governingBody',
        value: { en: 'FRMF / LNFP', fr: 'FRMF / LNFP', ar: 'الجامعة الملكية / العصبة الوطنية' },
      },
      {
        labelKey: 'promotion',
        value: {
          en: '2 to Botola Pro',
          fr: '2 vers la Botola Pro',
          ar: '2 إلى البطولة الاحترافية',
        },
      },
      {
        labelKey: 'relegation',
        value: {
          en: '2 to amateur division',
          fr: '2 vers la division amateur',
          ar: '2 إلى القسم الهاوي',
        },
      },
    ],
  },

  // ── Ligue 1 Tunisia (202) ─────────────────────────────────────────────────
  202: {
    description: {
      en: "The Ligue Professionnelle 1 is Tunisia's flagship football competition, overseen by the FTF. Sixteen clubs play 30 matchdays per season. Espérance de Tunis, Club Africain, and Étoile du Sahel have traditionally dominated, accumulating dozens of domestic titles and multiple CAF Champions League crowns between them. The league is a recognized talent pipeline for North African football, producing players who excel in Europe and beyond.",
      fr: "La Ligue Professionnelle 1 est la compétition phare du football tunisien, supervisée par la FTF. Seize clubs disputent 30 journées par saison. L'Espérance de Tunis, le Club Africain et l'Étoile du Sahel dominent traditionnellement, accumulant des dizaines de titres nationaux et plusieurs sacres en Ligue des Champions de la CAF. Le championnat est un vivier reconnu pour le football nord-africain, produisant des joueurs performants en Europe et au-delà.",
      ar: 'الرابطة المحترفة الأولى هي أبرز مسابقة كروية في تونس تحت إشراف الجامعة التونسية. يتنافس ستة عشر ناديًا في 30 جولة كل موسم. يهيمن الترجي الرياضي والنادي الأفريقي والنجم الساحلي تاريخيًا بعشرات الألقاب المحلية وتتويجات متعددة بدوري أبطال أفريقيا. يبقى الدوري رافدًا معترفًا به لكرة القدم في شمال أفريقيا منتجًا لاعبين يتألقون في أوروبا وخارجها.',
    },
    facts: [
      { labelKey: 'founded', value: { en: '1921', fr: '1921', ar: '1921' } },
      { labelKey: 'country', value: { en: 'Tunisia', fr: 'Tunisie', ar: 'تونس' } },
      { labelKey: 'teams', value: { en: '16', fr: '16', ar: '16' } },
      {
        labelKey: 'governingBody',
        value: {
          en: 'FTF (Fédération Tunisienne de Football)',
          fr: 'FTF (Fédération Tunisienne de Football)',
          ar: 'الجامعة التونسية لكرة القدم',
        },
      },
      {
        labelKey: 'relegation',
        value: { en: '3 to Ligue 2', fr: '3 vers la Ligue 2', ar: '3 إلى الدرجة الثانية' },
      },
    ],
  },

  // ── Süper Lig (203) ───────────────────────────────────────────────────────
  203: {
    description: {
      en: "The Süper Lig is Turkey's top-tier football division, founded in 1959 and governed by the TFF. Nineteen clubs compete across 36 matchdays. Istanbul's big three — Galatasaray, Fenerbahçe, and Beşiktaş — command massive followings and have claimed the vast majority of titles, though Trabzonspor and Başakşehir have broken through in recent years. The league's atmosphere, driven by vocal ultras and heated derbies, is among the most intense in European football.",
      fr: "La Süper Lig est la première division turque, fondée en 1959 sous l'autorité de la TFF. Dix-neuf clubs s'affrontent sur 36 journées. Les trois grands d'Istanbul — Galatasaray, Fenerbahçe et Beşiktaş — drainent des foules immenses et se partagent la grande majorité des titres, bien que Trabzonspor et Başakşehir aient percé récemment. L'ambiance du championnat, alimentée par des ultras passionnés et des derbys enflammés, figure parmi les plus intenses du football européen.",
      ar: 'الدوري التركي الممتاز هو دوري الدرجة الأولى في تركيا، تأسس عام 1959 تحت إشراف الاتحاد التركي. يتنافس تسعة عشر ناديًا في 36 جولة. تتصدر أندية إسطنبول الثلاثة الكبار — غلطة سراي وفنربخشه وبشكتاش — بجماهير ضخمة وغالبية الألقاب، رغم اختراق طرابزون سبور وباشاك شهير مؤخرًا. تُعد أجواء الدوري بين الأكثر حدة في أوروبا بفضل مجموعات الألتراس والديربيات الحامية.',
    },
    facts: [
      { labelKey: 'founded', value: { en: '1959', fr: '1959', ar: '1959' } },
      { labelKey: 'country', value: { en: 'Turkey', fr: 'Turquie', ar: 'تركيا' } },
      { labelKey: 'teams', value: { en: '19', fr: '19', ar: '19' } },
      {
        labelKey: 'governingBody',
        value: {
          en: 'TFF (Türkiye Futbol Federasyonu)',
          fr: 'TFF (Türkiye Futbol Federasyonu)',
          ar: 'الاتحاد التركي لكرة القدم',
        },
      },
      {
        labelKey: 'promotion',
        value: { en: '3 from 1. Lig', fr: '3 depuis la 1. Lig', ar: '3 من الدرجة الثانية' },
      },
      {
        labelKey: 'relegation',
        value: { en: '3 to 1. Lig', fr: '3 vers la 1. Lig', ar: '3 إلى الدرجة الثانية' },
      },
    ],
  },

  // ── Egyptian Premier League (233) ─────────────────────────────────────────
  233: {
    description: {
      en: "The Egyptian Premier League is the oldest and most prestigious league in African and Arab football, active since 1948. The season is split into a regular phase and championship/relegation playoffs. Al Ahly and Zamalek, Africa's two most decorated clubs, define the competition through the Cairo derby — a fixture that draws continental attention. The league is a major source of talent for Africa-wide club competitions and international duty.",
      fr: "La Premier League égyptienne est la plus ancienne et la plus prestigieuse ligue du football africain et arabe, active depuis 1948. La saison est divisée en une phase régulière et des playoffs de titre et de relégation. Al Ahly et le Zamalek, les deux clubs les plus titrés d'Afrique, définissent la compétition par le derby du Caire — une affiche qui attire l'attention continentale. Le championnat est un vivier majeur pour les compétitions africaines de clubs et les sélections nationales.",
      ar: 'الدوري المصري الممتاز هو أقدم وأعرق دوري في كرة القدم الأفريقية والعربية، يعمل منذ 1948. ينقسم الموسم إلى مرحلة دورية ومجموعات البطولة والهبوط. يحدد الأهلي والزمالك — أكثر أندية أفريقيا تتويجًا — هوية المنافسة عبر ديربي القاهرة الذي يستقطب اهتمامًا قاريًا. يظل الدوري مصدرًا رئيسيًا للمواهب في المسابقات الأفريقية والتمثيل الدولي.',
    },
    facts: [
      { labelKey: 'founded', value: { en: '1948', fr: '1948', ar: '1948' } },
      { labelKey: 'country', value: { en: 'Egypt', fr: 'Égypte', ar: 'مصر' } },
      { labelKey: 'teams', value: { en: '18', fr: '18', ar: '18' } },
      {
        labelKey: 'governingBody',
        value: {
          en: 'EFA (Egyptian Football Association)',
          fr: 'EFA (Fédération Égyptienne de Football)',
          ar: 'الاتحاد المصري لكرة القدم',
        },
      },
      {
        labelKey: 'relegation',
        value: {
          en: '3 to Second Division',
          fr: '3 vers la deuxième division',
          ar: '3 إلى الدرجة الثانية',
        },
      },
    ],
  },

  // ── UAE Pro League (301) ──────────────────────────────────────────────────
  301: {
    description: {
      en: 'The UAE Pro League is the top football division of the United Arab Emirates, governed by the UAEFA. Fourteen clubs compete across 26 matchdays in a season that runs from September to May. Al Ain, Shabab Al Ahli, and Al Wahda are among the most successful clubs historically. The league has attracted Moroccan players and coaches in significant numbers, and its investment in infrastructure — including air-conditioned stadiums — reflects the broader Gulf ambition for football development.',
      fr: "L'UAE Pro League est la première division de football des Émirats arabes unis, administrée par l'UAEFA. Quatorze clubs disputent 26 journées dans une saison de septembre à mai. Al Ain, Shabab Al Ahli et Al Wahda comptent parmi les clubs les plus titrés. Le championnat attire un nombre significatif de joueurs et d'entraîneurs marocains, et ses investissements en infrastructures — dont des stades climatisés — reflètent l'ambition plus large du Golfe pour le développement du football.",
      ar: 'دوري المحترفين الإماراتي هو الدوري الأول في الإمارات العربية المتحدة تحت إدارة اتحاد الكرة الإماراتي. يتنافس أربعة عشر ناديًا في 26 جولة خلال موسم يمتد من سبتمبر إلى مايو. يعد العين وشباب الأهلي والوحدة من أنجح الأندية تاريخيًا. يستقطب الدوري أعدادًا كبيرة من اللاعبين والمدربين المغاربة، وتعكس استثماراته في البنية التحتية بما فيها الملاعب المكيفة طموح الخليج الأوسع لتطوير كرة القدم.',
    },
    facts: [
      { labelKey: 'founded', value: { en: '1973', fr: '1973', ar: '1973' } },
      {
        labelKey: 'country',
        value: {
          en: 'United Arab Emirates',
          fr: 'Émirats arabes unis',
          ar: 'الإمارات العربية المتحدة',
        },
      },
      { labelKey: 'teams', value: { en: '14', fr: '14', ar: '14' } },
      {
        labelKey: 'governingBody',
        value: { en: 'UAEFA', fr: 'UAEFA', ar: 'اتحاد الإمارات لكرة القدم' },
      },
      {
        labelKey: 'relegation',
        value: {
          en: '2 to First Division',
          fr: '2 vers la First Division',
          ar: '2 إلى الدرجة الأولى',
        },
      },
    ],
  },

  // ── Saudi Pro League (307) ────────────────────────────────────────────────
  307: {
    description: {
      en: "The Saudi Pro League has been transformed into one of the world's most-watched leagues following a wave of high-profile signings since 2023. Eighteen clubs compete across 34 matchdays under the Saudi Arabian Football Federation. Al Hilal, Al Ittihad, Al Ahli, and Al Nassr have traditionally dominated, and the arrival of global stars has elevated international interest. Several Moroccan players have moved to the league, drawn by competitive salaries and the growing profile of Saudi club football.",
      fr: "La Saudi Pro League s'est transformée en l'un des championnats les plus suivis au monde grâce à une vague de recrutements de stars depuis 2023. Dix-huit clubs disputent 34 journées sous l'égide de la Fédération saoudienne. Al Hilal, Al Ittihad, Al Ahli et Al Nassr dominent traditionnellement, et l'arrivée de vedettes internationales a amplifié l'intérêt mondial. Plusieurs joueurs marocains ont rejoint le championnat, attirés par des salaires compétitifs et le rayonnement croissant du football saoudien.",
      ar: 'تحول دوري المحترفين السعودي إلى أحد أكثر الدوريات مشاهدة في العالم بعد موجة التعاقدات الكبيرة منذ 2023. يتنافس ثمانية عشر ناديًا في 34 جولة تحت مظلة الاتحاد السعودي. يهيمن الهلال والاتحاد والأهلي والنصر تاريخيًا، ورفع قدوم النجوم العالميين الاهتمام الدولي. انتقل عدد من اللاعبين المغاربة إلى الدوري مستقطبين برواتب تنافسية وتنامي مكانة كرة القدم السعودية.',
    },
    facts: [
      { labelKey: 'founded', value: { en: '1976', fr: '1976', ar: '1976' } },
      {
        labelKey: 'country',
        value: { en: 'Saudi Arabia', fr: 'Arabie Saoudite', ar: 'المملكة العربية السعودية' },
      },
      { labelKey: 'teams', value: { en: '18', fr: '18', ar: '18' } },
      {
        labelKey: 'governingBody',
        value: {
          en: 'SAFF (Saudi Arabian Football Federation)',
          fr: 'SAFF (Fédération Saoudienne de Football)',
          ar: 'الاتحاد السعودي لكرة القدم',
        },
      },
      {
        labelKey: 'promotion',
        value: {
          en: '2 from First Division',
          fr: '2 depuis la First Division',
          ar: '2 من دوري الأولى',
        },
      },
      {
        labelKey: 'relegation',
        value: {
          en: '2 to First Division',
          fr: '2 vers la First Division',
          ar: '2 إلى دوري الأولى',
        },
      },
    ],
  },
};

export function getLeagueAbout(competitionId: number): LeagueAboutEntry | null {
  return LEAGUE_ABOUT[competitionId] ?? null;
}
