/**
 * Per-locale About card content for WC 2026.
 * FR: adapted from competition-cup.md Section 11 with factual corrections.
 * EN/AR: drafted from FR — marked with REVIEW comments for user verification.
 *
 * VERIFIED FACTS (2026-05-15):
 * - WC 2026 hosts: USA, Canada, Mexico (3 countries, NOT Morocco)
 * - Morocco is NOT a host of WC 2026
 * - Morocco IS a co-host of WC 2030 (with Spain and Portugal)
 * - Group C: Brazil, Morocco, Haiti, Scotland (per API-Football DB standings)
 * - 16 host cities: 11 USA, 3 Mexico, 2 Canada
 * - 48 teams, 12 groups, 104 matches, June 11 - July 19 2026
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

// ── FR ──

const WC_2026_FR: AboutContent = {
  sections: [
    {
      heading: 'A propos de la Coupe du Monde FIFA 2026',
      body: "La Coupe du Monde FIFA 2026 est la 23eme edition du tournoi mondial de football masculin. Elle se deroule du 11 juin au 19 juillet 2026 dans 3 pays — les Etats-Unis, le Canada et le Mexique. C'est la premiere edition a 48 equipes, contre 32 lors des editions precedentes.",
    },
    {
      heading: 'Format de la competition',
      body: '48 equipes nationales reparties en 12 groupes de 4. Chaque equipe joue 3 matchs de phase de groupes. Les deux premiers de chaque groupe (24 equipes) plus les 8 meilleurs troisiemes (sur les 12) se qualifient pour la phase a elimination directe a partir des 1/16e de finale. 104 matchs au total.',
    },
    {
      heading: 'Le Maroc dans la Coupe du Monde 2026',
      body: "Le Maroc participe dans le Groupe C aux cotes du Bresil, d'Haiti et de l'Ecosse. Apres une demi-finale historique lors de la Coupe du Monde 2022 au Qatar (4eme place), les Lions de l'Atlas reviennent sur la scene mondiale avec l'ambition d'un nouvel exploit. Le Maroc co-organisera la Coupe du Monde 2030 avec l'Espagne et le Portugal.",
    },
    {
      heading: 'Stades et villes hotes',
      body: '16 villes hotes au total: 11 aux Etats-Unis (incl. New York, Los Angeles, Dallas, Boston, Houston, Miami, Philadelphia, Seattle, Atlanta, San Francisco, Kansas City), 3 au Mexique (Mexico City, Guadalajara, Monterrey) et 2 au Canada (Toronto, Vancouver). La finale aura lieu au MetLife Stadium dans le New Jersey.',
    },
    {
      heading: 'Vainqueurs precedents',
      body: "L'Argentine est tenante du titre (2022), avec 3 titres au total. Le Bresil detient le record avec 5 titres. L'Allemagne et l'Italie suivent avec 4 titres chacun. La France compte 2 titres. Aucune equipe africaine n'a remporte la competition; le Maroc a atteint la demi-finale en 2022 (meilleur resultat africain avec le Ghana en 2010).",
    },
    {
      heading: 'Atlas Kings sur la Coupe du Monde 2026',
      body: "Atlas Kings couvre la Coupe du Monde 2026 avec un focus particulier sur le parcours des Lions de l'Atlas, les Marocains a l'etranger participant pour leur selection, et les histoires de joueurs et entraineurs du continent africain.",
    },
  ],
  faqs: [
    {
      question: 'Quand commence et finit la Coupe du Monde 2026 ?',
      answer: 'Du 11 juin au 19 juillet 2026.',
    },
    {
      question: 'Dans quel groupe est le Maroc a la Coupe du Monde 2026 ?',
      answer: "Le Maroc est dans le Groupe C avec le Bresil, Haiti et l'Ecosse.",
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
      question: 'Ou se joue la finale de la Coupe du Monde 2026 ?',
      answer: 'Au MetLife Stadium a East Rutherford, New Jersey, Etats-Unis.',
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
      question: 'Le Maroc organisera-t-il une Coupe du Monde ?',
      answer:
        "Le Maroc co-organisera la Coupe du Monde 2030 avec l'Espagne et le Portugal, devenant le premier pays africain a accueillir le tournoi.",
    },
  ],
};

// ── EN ──
// REVIEW: verify player club accuracy (transfers may change)

const WC_2026_EN: AboutContent = {
  sections: [
    {
      heading: 'About the FIFA World Cup 2026',
      body: "The FIFA World Cup 2026 is the 23rd edition of the men's world football tournament. It takes place from 11 June to 19 July 2026 across 3 countries — the United States, Canada, and Mexico. This is the first edition to feature 48 teams, expanded from 32 in previous editions.",
    },
    {
      heading: 'Competition format',
      body: '48 national teams divided into 12 groups of 4. Each team plays 3 group-stage matches. The top 2 from each group (24 teams) plus the 8 best third-placed teams (out of 12) advance to the knockout stage starting from the Round of 32. 104 matches in total.',
    },
    {
      heading: 'Morocco at the 2026 World Cup',
      body: 'Morocco competes in Group C alongside Brazil, Haiti, and Scotland. After a historic semi-final run at the 2022 World Cup in Qatar (4th place), the Atlas Lions return to the world stage aiming for another major performance. Morocco will co-host the 2030 World Cup with Spain and Portugal.',
    },
    {
      heading: 'Stadiums and host cities',
      body: '16 host cities in total: 11 in the United States (incl. New York, Los Angeles, Dallas, Boston, Houston, Miami, Philadelphia, Seattle, Atlanta, San Francisco, Kansas City), 3 in Mexico (Mexico City, Guadalajara, Monterrey), and 2 in Canada (Toronto, Vancouver). The final will be held at MetLife Stadium in New Jersey.',
    },
    {
      heading: 'Previous winners',
      body: 'Argentina are the defending champions (2022), with 3 titles overall. Brazil hold the record with 5 titles. Germany and Italy follow with 4 each. France have 2 titles. No African team has won the tournament; Morocco reached the semi-final in 2022 (the best African result alongside Ghana in 2010).',
    },
    {
      heading: 'Atlas Kings on the 2026 World Cup',
      body: "Atlas Kings covers the 2026 World Cup with a particular focus on the Atlas Lions' journey, Moroccan players abroad representing their national team, and stories of players and coaches from the African continent.",
    },
  ],
  faqs: [
    {
      question: 'When does the 2026 World Cup start and end?',
      answer: 'From 11 June to 19 July 2026.',
    },
    {
      question: 'Which group is Morocco in at the 2026 World Cup?',
      answer: 'Morocco is in Group C with Brazil, Haiti, and Scotland.',
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
      question: 'Where is the 2026 World Cup final?',
      answer: 'MetLife Stadium in East Rutherford, New Jersey, United States.',
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
      question: 'Will Morocco host a World Cup?',
      answer:
        'Morocco will co-host the 2030 World Cup with Spain and Portugal, becoming the first African nation to host the tournament.',
    },
  ],
};

// ── AR ──
// REVIEW: verify Arabic phrasing, player name transliterations

const WC_2026_AR: AboutContent = {
  sections: [
    {
      heading: 'حول كأس العالم فيفا 2026',
      body: 'كأس العالم فيفا 2026 هي النسخة الـ23 من بطولة كأس العالم لكرة القدم للرجال. تقام من 11 يونيو إلى 19 يوليو 2026 في 3 دول — الولايات المتحدة وكندا والمكسيك. هذه أول نسخة بمشاركة 48 منتخباً بدلاً من 32 في النسخ السابقة.',
    },
    {
      heading: 'نظام البطولة',
      body: '48 منتخباً وطنياً موزعين على 12 مجموعة من 4 فرق. يلعب كل منتخب 3 مباريات في مرحلة المجموعات. يتأهل أول فريقين من كل مجموعة (24 منتخباً) بالإضافة إلى أفضل 8 فرق من أصحاب المركز الثالث (من 12 مجموعة) إلى مرحلة الإقصاء بدءاً من دور الـ32. 104 مباريات إجمالاً.',
    },
    {
      heading: 'المغرب في كأس العالم 2026',
      body: 'يشارك المغرب في المجموعة C إلى جانب البرازيل وهايتي واسكتلندا. بعد إنجاز تاريخي بالوصول إلى نصف النهائي في كأس العالم 2022 في قطر (المركز الرابع)، يعود أسود الأطلس إلى المسرح العالمي طامحين لتحقيق إنجاز كبير جديد. سيستضيف المغرب كأس العالم 2030 مع إسبانيا والبرتغال.',
    },
    {
      heading: 'الملاعب والمدن المستضيفة',
      body: '16 مدينة مستضيفة إجمالاً: 11 في الولايات المتحدة (من بينها نيويورك ولوس أنجلوس ودالاس وبوسطن وهيوستن وميامي وفيلادلفيا وسياتل وأتلانتا وسان فرانسيسكو وكانساس سيتي)، 3 في المكسيك (مكسيكو سيتي وغوادالاخارا ومونتيري)، و2 في كندا (تورنتو وفانكوفر). ستقام المباراة النهائية في ملعب ميتلايف في نيوجيرسي.',
    },
    {
      heading: 'الفائزون السابقون',
      body: 'الأرجنتين هي حاملة اللقب (2022) بـ3 ألقاب إجمالاً. البرازيل تحمل الرقم القياسي بـ5 ألقاب. تليها ألمانيا وإيطاليا بـ4 ألقاب لكل منهما. فرنسا بلقبين. لم يفز أي منتخب إفريقي بالبطولة؛ المغرب وصل إلى نصف النهائي في 2022 (أفضل نتيجة إفريقية إلى جانب غانا في 2010).',
    },
    {
      heading: 'أطلس كينغز وكأس العالم 2026',
      body: 'يغطي أطلس كينغز كأس العالم 2026 مع تركيز خاص على مسيرة أسود الأطلس، واللاعبين المغاربة المحترفين في الخارج الذين يمثلون منتخبهم، وقصص اللاعبين والمدربين من القارة الإفريقية.',
    },
  ],
  faqs: [
    {
      question: 'متى تبدأ وتنتهي كأس العالم 2026؟',
      answer: 'من 11 يونيو إلى 19 يوليو 2026.',
    },
    {
      question: 'في أي مجموعة يلعب المغرب في كأس العالم 2026؟',
      answer: 'المغرب في المجموعة C مع البرازيل وهايتي واسكتلندا.',
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
      question: 'أين تُقام نهائي كأس العالم 2026؟',
      answer: 'في ملعب ميتلايف في إيست رذرفورد، نيوجيرسي، الولايات المتحدة.',
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
      question: 'هل سيستضيف المغرب كأس العالم؟',
      answer:
        'سيستضيف المغرب كأس العالم 2030 مع إسبانيا والبرتغال، ليصبح أول بلد إفريقي يستضيف البطولة.',
    },
  ],
};

const ABOUT_CONTENT_REGISTRY: Record<number, Record<Locale, AboutContent>> = {
  1: { fr: WC_2026_FR, en: WC_2026_EN, ar: WC_2026_AR },
};

export function getAboutContent(competitionId: number, locale: Locale): AboutContent | undefined {
  return ABOUT_CONTENT_REGISTRY[competitionId]?.[locale];
}
