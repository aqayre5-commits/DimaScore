/**
 * Homepage editorial brand narrative — the closing brand story below the live-scores dashboard.
 * Editorial voice: British English source, native French, Modern Standard Arabic with football register.
 */

import type { Locale } from '@/lib/i18n/config';

export interface EditorialSection {
  heading: string;
  paragraphs: string[];
}

export interface HomepageEditorial {
  sections: EditorialSection[];
  closing: { heading: string; body: string };
}

const EN: HomepageEditorial = {
  sections: [
    {
      heading: "Football doesn't start at kick-off",
      paragraphs: [
        'A match is more than the scoreline. It is the form that led to it, the table pressure behind it, the players carrying momentum, and the supporters who know what every point can mean.',
        'DimaScore connects the live match to the bigger picture. Every page opens onto the next — a competition to its fixtures and table, a match to its teams, a player back to his club and recent games. So you can follow a season, not just a result.',
      ],
    },
    {
      heading: 'Moroccan football at the centre',
      paragraphs: [
        'DimaScore follows the competitions that shape the Moroccan game: Botola Pro, Botola 2, the Coupe du Trône, the national teams and the CAF club competitions.',
        'Casablanca derbies and title races, relegation fights and cup runs — the domestic game gets full attention, not an afterthought.',
      ],
    },
    {
      heading: "The Atlas Lions and Morocco's national teams",
      paragraphs: [
        "Morocco's national teams are followed now with expectation, not surprise.",
        "DimaScore tracks the Atlas Lions, the women's side and the youth selections — fixtures, results, squads and the context around them, from AFCON and WAFCON to World Cup qualifying and the global stage itself.",
      ],
    },
    {
      heading: 'Beyond Morocco: Africa, Europe and players abroad',
      paragraphs: [
        'Moroccan football does not stand alone. Its clubs travel for CAF nights across the continent; its players start every week in Europe, the Middle East and beyond.',
        'DimaScore follows that wider map: the CAF Champions League and Confederation Cup where Moroccan clubs compete, the major leagues where Moroccan internationals feature, and the player pages, fixtures and results that keep everything connected.',
        'Global football, seen through a Moroccan lens.',
      ],
    },
    {
      heading: 'Live scores with context',
      paragraphs: [
        'DimaScore match pages are built for the minutes that matter — score, status, goals, cards, substitutions, lineups and key stats.',
        'Check form and standings before kick-off, follow the events live, and see what the result changes at full-time.',
      ],
    },
    {
      heading: 'Football without betting odds',
      paragraphs: [
        'DimaScore shows no betting odds.',
        'This is football information: live scores, fixtures, standings, squads, player profiles, match details and editorial coverage — without turning the match into a market.',
      ],
    },
    {
      heading: 'Built for Moroccan fans, wherever they are',
      paragraphs: [
        'DimaScore is made for supporters in Morocco and for Moroccan fans following the game from anywhere.',
        'In Arabic, French and English, it brings local passion and international coverage into one place — Botola weekends, CAF away trips, European nights and World Cup summers alike.',
      ],
    },
  ],
  closing: {
    heading: 'Follow the match. Understand the season.',
    body: 'Live scores tell you what is happening. DimaScore tells you why it matters — Moroccan football, African competitions, global tournaments and the players carrying Morocco abroad, all in one place.',
  },
};

const FR: HomepageEditorial = {
  sections: [
    {
      heading: "Le football ne commence pas au coup d'envoi",
      paragraphs: [
        "Un match, c'est plus qu'un score. C'est la forme qui y mène, la pression du classement derrière, les joueurs qui portent l'élan, et les supporters qui savent ce que chaque point peut changer.",
        "DimaScore relie le match en direct à l'image d'ensemble. Chaque page ouvre sur la suivante — une compétition vers ses matchs et son classement, un match vers ses équipes, un joueur vers son club et ses dernières rencontres. Pour suivre une saison, pas seulement un résultat.",
      ],
    },
    {
      heading: 'Le football marocain au centre',
      paragraphs: [
        'DimaScore suit les compétitions qui façonnent le football marocain : Botola Pro, Botola 2, Coupe du Trône, les sélections nationales et les compétitions interclubs de la CAF.',
        'Derbies de Casablanca et courses au titre, luttes pour le maintien et parcours en coupe — le football national reçoit toute l’attention qu’il mérite, pas une pensée après coup.',
      ],
    },
    {
      heading: "Les Lions de l'Atlas et les sélections du Maroc",
      paragraphs: [
        'Les sélections du Maroc se suivent désormais avec attente, plus avec surprise.',
        "DimaScore suit les Lions de l'Atlas, la sélection féminine et les catégories de jeunes — calendrier, résultats, effectifs et le contexte autour, de la CAN et la CAN féminine aux qualifications de la Coupe du Monde et à la scène mondiale elle-même.",
      ],
    },
    {
      heading: "Au-delà du Maroc : l'Afrique, l'Europe et les joueurs à l'étranger",
      paragraphs: [
        "Le football marocain n'existe pas en vase clos. Ses clubs voyagent pour les soirées africaines de la CAF ; ses joueurs sont titulaires chaque semaine en Europe, au Moyen-Orient et au-delà.",
        'DimaScore suit cette carte élargie : la Ligue des champions et la Coupe de la Confédération de la CAF où rivalisent les clubs marocains, les grands championnats où évoluent les internationaux marocains, et les pages joueurs, calendriers et résultats qui relient le tout.',
        'Le football mondial, vu à travers un prisme marocain.',
      ],
    },
    {
      heading: 'Des scores en direct, avec le contexte',
      paragraphs: [
        'Les pages de match DimaScore sont pensées pour les minutes qui comptent — score, statut, buts, cartons, remplacements, compositions et statistiques clés.',
        "Avant le coup d'envoi, la forme et le classement ; pendant le match, le fil des événements ; au coup de sifflet final, ce que le résultat change.",
      ],
    },
    {
      heading: 'Du football, sans cotes de paris',
      paragraphs: [
        "DimaScore n'affiche aucune cote de paris.",
        "C'est de l'information football : scores en direct, calendrier, classements, effectifs, profils de joueurs, détails de match et couverture éditoriale — sans transformer le match en marché.",
      ],
    },
    {
      heading: 'Pensé pour les supporters marocains, où qu’ils soient',
      paragraphs: [
        'DimaScore est fait pour les supporters au Maroc et pour les Marocains qui suivent le jeu depuis partout.',
        'En arabe, en français et en anglais, il réunit la passion locale et la couverture internationale en un seul endroit — week-ends de Botola, déplacements africains en CAF, soirées européennes et étés de Coupe du Monde.',
      ],
    },
  ],
  closing: {
    heading: 'Suivez le match. Comprenez la saison.',
    body: "Les scores en direct disent ce qui se passe. DimaScore dit pourquoi ça compte — football marocain, compétitions africaines, tournois mondiaux et les joueurs qui portent le Maroc à l'étranger, en un seul endroit.",
  },
};

const AR: HomepageEditorial = {
  sections: [
    {
      heading: 'كرة القدم لا تبدأ بصافرة البداية',
      paragraphs: [
        'المباراة أكثر من نتيجة. إنها الحالة الفنية التي مهّدت لها، وضغط الترتيب من خلفها، واللاعبون الذين يحملون الاندفاع، والجماهير التي تدرك ما يمكن أن تغيّره كل نقطة.',
        'يربط ديما سكور المباراة المباشرة بالصورة الأشمل. كل صفحة تفضي إلى التالية — من المسابقة إلى مبارياتها وترتيبها، ومن المباراة إلى فريقيها، ومن اللاعب إلى ناديه ومبارياته الأخيرة. لتتابع موسماً كاملاً، لا نتيجة واحدة.',
      ],
    },
    {
      heading: 'الكرة المغربية في الصميم',
      paragraphs: [
        'يتابع ديما سكور المسابقات التي تصنع الكرة المغربية: البطولة الاحترافية، البطولة الاحترافية 2، كأس العرش، المنتخبات الوطنية، ومسابقات الأندية الإفريقية (الكاف).',
        'ديربيات الدار البيضاء وصراعات اللقب، ومعارك البقاء ومشاوير الكأس — الكرة المحلية تنال كامل الاهتمام الذي تستحقه، لا اهتماماً عابراً.',
      ],
    },
    {
      heading: 'أسود الأطلس ومنتخبات المغرب',
      paragraphs: [
        'تُتابَع منتخبات المغرب اليوم بالترقّب، لا بالمفاجأة.',
        'يتابع ديما سكور أسود الأطلس، والمنتخب النسوي، والفئات الشابة — المواعيد والنتائج والتشكيلات والسياق المحيط بها، من كأس أمم إفريقيا وكأس أمم إفريقيا للسيدات إلى تصفيات كأس العالم والساحة العالمية ذاتها.',
      ],
    },
    {
      heading: 'أبعد من المغرب: إفريقيا وأوروبا واللاعبون في الخارج',
      paragraphs: [
        'لا تعيش الكرة المغربية في عزلة. أنديتها تسافر لليالي الكاف الإفريقية؛ ولاعبوها أساسيون كل أسبوع في أوروبا والشرق الأوسط وما بعدهما.',
        'يتابع ديما سكور هذه الخريطة الأوسع: دوري أبطال إفريقيا وكأس الكونفدرالية حيث تنافس الأندية المغربية، والدوريات الكبرى حيث يبرز الدوليون المغاربة، وصفحات اللاعبين والمواعيد والنتائج التي تربط كل ذلك.',
        'كرة القدم العالمية، من منظور مغربي.',
      ],
    },
    {
      heading: 'نتائج مباشرة، مع السياق',
      paragraphs: [
        'صُمِّمت صفحات المباريات في ديما سكور للحظات التي تهمّ — النتيجة، والحالة، والأهداف، والبطاقات، والتبديلات، والتشكيلات والإحصائيات الأساسية.',
        'قبل المباراة: الحالة الفنية والترتيب؛ وخلالها: مجريات الأحداث؛ وبعد صافرة النهاية: ما الذي تغيّره النتيجة.',
      ],
    },
    {
      heading: 'كرة قدم بلا حصص رهان',
      paragraphs: [
        'لا يعرض ديما سكور أي حصص رهان.',
        'هي معلومات كروية: نتائج مباشرة، ومواعيد، وترتيب، وتشكيلات، وملفات لاعبين، وتفاصيل المباريات وتغطية تحريرية — دون تحويل المباراة إلى سوق.',
      ],
    },
    {
      heading: 'مصمَّم للجماهير المغربية أينما كانت',
      paragraphs: [
        'صُنع ديما سكور لجماهير المغرب وللمغاربة الذين يتابعون اللعبة من أي مكان.',
        'بالعربية والفرنسية والإنجليزية، يجمع الشغف المحلي والتغطية الدولية في مكان واحد — عطل البطولة، والأسفار الإفريقية في الكاف، والليالي الأوروبية وصيف كأس العالم.',
      ],
    },
  ],
  closing: {
    heading: 'تابِع المباراة. افهَم الموسم.',
    body: 'النتائج المباشرة تخبرك بما يحدث. ديما سكور يخبرك لماذا يهمّ — الكرة المغربية، والمسابقات الإفريقية، والبطولات العالمية واللاعبون الذين يحملون المغرب إلى الخارج، في مكان واحد.',
  },
};

const BY_LOCALE: Record<Locale, HomepageEditorial> = { en: EN, fr: FR, ar: AR };

export function getHomepageEditorial(locale: Locale): HomepageEditorial {
  return BY_LOCALE[locale] ?? EN;
}
