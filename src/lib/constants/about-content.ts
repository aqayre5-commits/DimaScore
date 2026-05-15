/**
 * Per-locale About card content for WC 2026.
 * FR: verbatim from competition-cup.md Section 11.
 * EN/AR: drafted from FR — marked with REVIEW comments for user verification.
 */

import type { Locale } from '@/lib/i18n/config';

export interface AboutSection {
  heading: string;
  body: string;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface AboutContent {
  sections: AboutSection[];
  faqs: FaqEntry[];
}

// ── FR — verbatim from competition-cup.md §11 ──

const WC_2026_FR: AboutContent = {
  sections: [
    {
      heading: 'A propos de la Coupe du Monde FIFA 2026',
      body: "La Coupe du Monde FIFA 2026 est la 23eme edition du tournoi mondial de football masculin. Elle se deroule du 11 juin au 19 juillet 2026 dans 4 pays — les Etats-Unis, le Canada, le Mexique et le Maroc — marquant la premiere participation africaine a l'organisation de la Coupe du Monde et la premiere edition a 48 equipes.",
    },
    {
      heading: 'Format de la competition',
      body: '48 equipes nationales reparties en 12 groupes de 4. Chaque equipe joue 3 matchs de phase de groupes. Les deux premiers de chaque groupe (24 equipes) plus les 8 meilleurs troisiemes (sur les 12) se qualifient pour la phase a elimination directe a partir des 1/16e de finale. 104 matchs au total.',
    },
    {
      heading: 'Le Maroc dans la Coupe du Monde 2026',
      body: "Le Maroc est co-organisateur (en 2030, hote unique) et participe dans le Groupe C aux cotes de l'Argentine (tenant du titre), l'Arabie saoudite et l'Egypte. Six villes marocaines accueillent des matchs: Casablanca (Stade Hassan II), Rabat (Stade Mohammed V), Tanger (Grand Stade), Marrakech (Grand Stade), Agadir (Stade Adrar) et Fes (Stade de Fes). Demi-finale historique en 2022 (4eme place), les Lions de l'Atlas visent une nouvelle performance majeure.",
    },
    {
      heading: 'Stades et villes hotes',
      body: '16 villes hotes au total: 11 aux Etats-Unis (incl. New York, Los Angeles, Dallas, Boston), 3 au Mexique (Mexico City, Guadalajara, Monterrey), 2 au Canada (Toronto, Vancouver), 6 au Maroc (les six citees ci-dessus). La finale aura lieu au MetLife Stadium dans le New Jersey.',
    },
    {
      heading: 'Vainqueurs precedents',
      body: "L'Argentine est tenante du titre (2022), avec 3 titres au total. Le Bresil detient le record avec 5 titres. L'Allemagne, l'Italie et la France suivent. Aucune equipe africaine n'a remporte la competition; le Maroc et le Cameroun ont atteint la demi-finale (Maroc 2022, Cameroun 1990 - quart de finale).",
    },
    {
      heading: 'Atlas Kings sur la Coupe du Monde 2026',
      body: "Atlas Kings couvre la Coupe du Monde 2026 avec un focus particulier sur le parcours des Lions de l'Atlas, les Marocains a l'etranger participant pour leur selection, les matchs disputes au Maroc, et les histoires de joueurs et entraineurs du continent africain.",
    },
  ],
  faqs: [
    {
      question: 'Quand commence et finit la Coupe du Monde 2026 ?',
      answer: 'Du 11 juin au 19 juillet 2026.',
    },
    {
      question: 'Dans quel groupe est le Maroc a la Coupe du Monde 2026 ?',
      answer: "Le Maroc est dans le Groupe C avec l'Argentine, l'Arabie saoudite et l'Egypte.",
    },
    {
      question: "Combien d'equipes participent a la Coupe du Monde 2026 ?",
      answer:
        "48 equipes nationales, soit 16 de plus qu'en 2022. C'est la 1ere edition au format elargi.",
    },
    {
      question: 'Ou regarder la Coupe du Monde 2026 au Maroc ?',
      answer: 'Les matchs sont diffuses sur Arryadia TV et SNRT (chaines publiques marocaines).',
    },
    {
      question: 'Quelles villes marocaines accueillent des matchs ?',
      answer: 'Six villes: Casablanca, Rabat, Tanger, Marrakech, Agadir et Fes.',
    },
    {
      question: "Quels Marocains de l'etranger jouent pour le Maroc ?",
      answer:
        'Achraf Hakimi (PSG), Brahim Diaz (Bayern), Noussair Mazraoui (Man Utd), Youssef En-Nesyri (Fenerbahce), Sofyan Amrabat (Real Betis), Nayef Aguerd (Real Sociedad), entre autres.',
    },
    {
      question: 'Comment fonctionne la qualification au 1/16e de finale ?',
      answer:
        'Top 2 de chaque groupe + 8 meilleurs troisiemes (parmi les 12 groupes) = 32 equipes en 1/16e.',
    },
    {
      question: 'Le Maroc a-t-il deja accueilli la Coupe du Monde ?',
      answer:
        "Non, 2026 est la 1ere participation marocaine a l'organisation. Le Maroc sera egalement hote (avec l'Espagne et le Portugal) en 2030.",
    },
  ],
};

// ── EN — drafted from FR ──
// REVIEW: verify tone, player club accuracy, factual claims

const WC_2026_EN: AboutContent = {
  sections: [
    {
      heading: 'About the FIFA World Cup 2026',
      body: "The FIFA World Cup 2026 is the 23rd edition of the men's world football tournament. It takes place from 11 June to 19 July 2026 across 4 countries — the United States, Canada, Mexico, and Morocco — marking Africa's first involvement as a World Cup host nation and the first edition to feature 48 teams.",
    },
    {
      heading: 'Competition format',
      body: '48 national teams divided into 12 groups of 4. Each team plays 3 group-stage matches. The top 2 from each group (24 teams) plus the 8 best third-placed teams (out of 12) advance to the knockout stage starting from the Round of 32. 104 matches in total.',
    },
    {
      heading: 'Morocco at the 2026 World Cup',
      body: 'Morocco is a co-host (and sole host in 2030) and competes in Group C alongside Argentina (defending champions), Saudi Arabia, and Egypt. Six Moroccan cities host matches: Casablanca (Stade Hassan II), Rabat (Stade Mohammed V), Tangier (Grand Stade), Marrakech (Grand Stade), Agadir (Stade Adrar), and Fez (Stade de Fes). After a historic semi-final run in 2022 (4th place), the Atlas Lions aim for another major performance.',
    },
    {
      heading: 'Stadiums and host cities',
      body: '16 host cities in total: 11 in the United States (incl. New York, Los Angeles, Dallas, Boston), 3 in Mexico (Mexico City, Guadalajara, Monterrey), 2 in Canada (Toronto, Vancouver), and 6 in Morocco (listed above). The final will be held at MetLife Stadium in New Jersey.',
    },
    {
      heading: 'Previous winners',
      body: 'Argentina are the defending champions (2022), with 3 titles overall. Brazil hold the record with 5 titles. Germany, Italy, and France follow. No African team has won the tournament; Morocco and Cameroon have reached the furthest stages (Morocco 2022 semi-final, Cameroon 1990 quarter-final).',
    },
    {
      heading: 'Atlas Kings on the 2026 World Cup',
      body: "Atlas Kings covers the 2026 World Cup with a particular focus on the Atlas Lions' journey, Moroccan players abroad representing their national team, matches played in Morocco, and stories of players and coaches from the African continent.",
    },
  ],
  faqs: [
    {
      question: 'When does the 2026 World Cup start and end?',
      answer: 'From 11 June to 19 July 2026.',
    },
    {
      question: 'Which group is Morocco in at the 2026 World Cup?',
      answer: 'Morocco is in Group C with Argentina, Saudi Arabia, and Egypt.',
    },
    {
      question: 'How many teams are in the 2026 World Cup?',
      answer:
        '48 national teams — 16 more than in 2022. This is the first edition with the expanded format.',
    },
    {
      question: 'Where to watch the 2026 World Cup in Morocco?',
      answer: 'Matches are broadcast on Arryadia TV and SNRT (Moroccan public channels).',
    },
    {
      question: 'Which Moroccan cities host World Cup matches?',
      answer: 'Six cities: Casablanca, Rabat, Tangier, Marrakech, Agadir, and Fez.',
    },
    {
      question: 'Which Moroccan players abroad play for Morocco?',
      answer:
        'Achraf Hakimi (PSG), Brahim Diaz (Bayern), Noussair Mazraoui (Man Utd), Youssef En-Nesyri (Fenerbahce), Sofyan Amrabat (Real Betis), Nayef Aguerd (Real Sociedad), among others.',
    },
    {
      question: 'How does Round of 32 qualification work?',
      answer:
        'Top 2 from each group + 8 best third-placed teams (from 12 groups) = 32 teams in the Round of 32.',
    },
    {
      question: 'Has Morocco ever hosted the World Cup before?',
      answer:
        "No, 2026 is Morocco's first time as a World Cup host. Morocco will also co-host (with Spain and Portugal) in 2030.",
    },
  ],
};

// ── AR — drafted from FR ──
// REVIEW: verify Arabic phrasing, player name transliterations, factual claims

const WC_2026_AR: AboutContent = {
  sections: [
    {
      heading: 'حول كأس العالم فيفا 2026',
      body: 'كأس العالم فيفا 2026 هي النسخة الـ23 من بطولة كأس العالم لكرة القدم للرجال. تقام من 11 يونيو إلى 19 يوليو 2026 في 4 دول — الولايات المتحدة وكندا والمكسيك والمغرب — في أول مشاركة إفريقية في استضافة كأس العالم وأول نسخة بمشاركة 48 منتخباً.',
    },
    {
      heading: 'نظام البطولة',
      body: '48 منتخباً وطنياً موزعين على 12 مجموعة من 4 فرق. يلعب كل منتخب 3 مباريات في مرحلة المجموعات. يتأهل أول فريقين من كل مجموعة (24 منتخباً) بالإضافة إلى أفضل 8 فرق من أصحاب المركز الثالث (من 12 مجموعة) إلى مرحلة الإقصاء بدءاً من دور الـ32. 104 مباريات إجمالاً.',
    },
    {
      heading: 'المغرب في كأس العالم 2026',
      body: 'المغرب مستضيف مشارك (ومستضيف وحيد في 2030) ويشارك في المجموعة C إلى جانب الأرجنتين (حاملة اللقب) والمملكة العربية السعودية ومصر. ست مدن مغربية تستضيف مباريات: الدار البيضاء (ملعب الحسن الثاني)، الرباط (ملعب محمد الخامس)، طنجة (الملعب الكبير)، مراكش (الملعب الكبير)، أكادير (ملعب أدرار) وفاس (ملعب فاس). بعد إنجاز تاريخي بالوصول إلى نصف النهائي في 2022 (المركز الرابع)، يطمح أسود الأطلس لتحقيق إنجاز كبير جديد.',
    },
    {
      heading: 'الملاعب والمدن المستضيفة',
      body: '16 مدينة مستضيفة إجمالاً: 11 في الولايات المتحدة (من بينها نيويورك ولوس أنجلوس ودالاس وبوسطن)، 3 في المكسيك (مكسيكو سيتي وغوادالاخارا ومونتيري)، 2 في كندا (تورنتو وفانكوفر)، و6 في المغرب (المذكورة أعلاه). ستقام المباراة النهائية في ملعب ميتلايف في نيوجيرسي.',
    },
    {
      heading: 'الفائزون السابقون',
      body: 'الأرجنتين هي حاملة اللقب (2022) بـ3 ألقاب إجمالاً. البرازيل تحمل الرقم القياسي بـ5 ألقاب. تليها ألمانيا وإيطاليا وفرنسا. لم يفز أي منتخب إفريقي بالبطولة؛ المغرب والكاميرون وصلا إلى أبعد مرحلة (المغرب نصف النهائي 2022، الكاميرون ربع النهائي 1990).',
    },
    {
      heading: 'أطلس كينغز وكأس العالم 2026',
      body: 'يغطي أطلس كينغز كأس العالم 2026 مع تركيز خاص على مسيرة أسود الأطلس، واللاعبين المغاربة المحترفين في الخارج الذين يمثلون منتخبهم، والمباريات المقامة في المغرب، وقصص اللاعبين والمدربين من القارة الإفريقية.',
    },
  ],
  faqs: [
    {
      question: 'متى تبدأ وتنتهي كأس العالم 2026؟',
      answer: 'من 11 يونيو إلى 19 يوليو 2026.',
    },
    {
      question: 'في أي مجموعة يلعب المغرب في كأس العالم 2026؟',
      answer: 'المغرب في المجموعة C مع الأرجنتين والمملكة العربية السعودية ومصر.',
    },
    {
      question: 'كم عدد المنتخبات المشاركة في كأس العالم 2026؟',
      answer: '48 منتخباً وطنياً، أي 16 أكثر من نسخة 2022. هذه أول نسخة بالصيغة الموسعة.',
    },
    {
      question: 'أين يمكن مشاهدة كأس العالم 2026 في المغرب؟',
      answer: 'تُبث المباريات على قناة الرياضية وقنوات SNRT (القنوات العمومية المغربية).',
    },
    {
      question: 'ما المدن المغربية التي تستضيف مباريات كأس العالم؟',
      answer: 'ست مدن: الدار البيضاء، الرباط، طنجة، مراكش، أكادير وفاس.',
    },
    {
      question: 'من هم اللاعبون المغاربة المحترفون الذين يمثلون المغرب؟',
      answer:
        'أشرف حكيمي (باريس سان جيرمان)، إبراهيم دياز (بايرن)، نصير مزراوي (مانشستر يونايتد)، يوسف النصيري (فنربخشة)، سفيان أمرابط (ريال بيتيس)، نايف أكرد (ريال سوسيداد)، وغيرهم.',
    },
    {
      question: 'كيف يعمل نظام التأهل إلى دور الـ32؟',
      answer:
        'أول فريقين من كل مجموعة + أفضل 8 فرق ثالثة (من 12 مجموعة) = 32 منتخباً في دور الـ32.',
    },
    {
      question: 'هل سبق للمغرب أن استضاف كأس العالم؟',
      answer:
        'لا، 2026 هي أول استضافة مغربية لكأس العالم. المغرب سيستضيف أيضاً (مع إسبانيا والبرتغال) في 2030.',
    },
  ],
};

const ABOUT_CONTENT_REGISTRY: Record<number, Record<Locale, AboutContent>> = {
  1: { fr: WC_2026_FR, en: WC_2026_EN, ar: WC_2026_AR },
};

export function getAboutContent(competitionId: number, locale: Locale): AboutContent | undefined {
  return ABOUT_CONTENT_REGISTRY[competitionId]?.[locale];
}
