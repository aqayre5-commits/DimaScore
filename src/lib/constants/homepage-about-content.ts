/**
 * Homepage About card content — 5 H2 sections + 8 FAQs per locale.
 * Per homepage.md §9. Long-form keyword-bearing content for long-tail SEO.
 */

import type { Locale } from '@/lib/i18n/config';
import type { AboutContent } from './about-content';

// ── French (primary Morocco audience) ──

const HOMEPAGE_FR: AboutContent = {
  cards: [
    {
      id: 'about-atlas-kings',
      heading: '\u00c0 propos d\u2019Atlas Kings',
      blocks: [
        {
          type: 'prose',
          text: 'Atlas Kings est la plateforme de r\u00e9f\u00e9rence pour le football marocain et international. Lanc\u00e9e en 2026, elle couvre plus de 36 comp\u00e9titions, 320+ clubs et 6\u202f000+ joueurs avec des donn\u00e9es en temps r\u00e9el, des classements mis \u00e0 jour \u00e0 chaque journ\u00e9e, et une couverture \u00e9ditoriale ax\u00e9e sur le football vu du Maroc.',
        },
      ],
    },
    {
      id: 'competitions-covered',
      heading: 'Comp\u00e9titions couvertes',
      blocks: [
        {
          type: 'prose',
          text: 'Atlas Kings suit la Botola Pro Inwi (1\u00e8re division), la Botola Pro 2 et la Coupe du Tr\u00f4ne au Maroc\u202f; la CAF Champions League, la Coupe de la Conf\u00e9d\u00e9ration CAF, l\u2019AFCON et la WAFCON pour l\u2019Afrique\u202f; la Coupe du Monde 2026, les qualifications FIFA et la Coupe du Monde U-17 2026\u202f; les cinq grandes ligues europ\u00e9ennes (Premier League, LaLiga, Bundesliga, Serie A, Ligue 1)\u202f; l\u2019UEFA Champions League, Europa League et Conference League\u202f; et les principales comp\u00e9titions MENA (AFC Asian Cup, Saudi Pro League, Egyptian Premier).',
        },
      ],
    },
    {
      id: 'moroccan-football',
      heading: 'Le football marocain',
      blocks: [
        {
          type: 'prose',
          text: 'La Botola Pro r\u00e9unit 16 clubs, dont les rivalit\u00e9s historiques entre Wydad AC et Raja CA, le derby de Casablanca le plus suivi d\u2019Afrique du Nord. AS FAR, Maghreb F\u00e8s, Renaissance Berkane et Hassania Agadir compl\u00e8tent le haut du classement. L\u2019\u00e9quipe nationale du Maroc \u2014 les Lions de l\u2019Atlas \u2014 joue ses matchs au Complexe Mohammed V de Rabat. Sur la sc\u00e8ne continentale, Wydad AC est le club marocain le plus titr\u00e9 en CAF Champions League avec trois victoires.',
        },
      ],
    },
    {
      id: 'world-cup-2026',
      heading: 'La Coupe du Monde 2026',
      blocks: [
        {
          type: 'prose',
          text: 'La Coupe du Monde FIFA 2026 r\u00e9unit 48 \u00e9quipes aux \u00c9tats-Unis, au Canada et au Mexique \u2014 la premi\u00e8re \u00e9dition dans ce format \u00e9largi. Phase de groupes\u202f: 12 groupes de 4 \u00e9quipes, les 2 premiers de chaque groupe et les 8 meilleurs troisi\u00e8mes se qualifient pour les 32es de finale. La comp\u00e9tition se d\u00e9roule du 11 juin au 19 juillet 2026. Le Maroc est dans le Groupe C avec l\u2019Argentine, l\u2019Arabie saoudite et l\u2019\u00c9gypte.',
        },
      ],
    },
    {
      id: 'moroccans-abroad',
      heading: 'Atlas Kings et les Marocains \u00e0 l\u2019\u00e9tranger',
      blocks: [
        {
          type: 'prose',
          text: 'Atlas Kings suit en d\u00e9tail les performances des joueurs marocains dans les championnats \u00e9trangers. Achraf Hakimi (PSG, Ligue 1 et UCL), Brahim Diaz (Bayern Munich, Bundesliga et UCL), Noussair Mazraoui (Manchester United, Premier League), Youssef En-Nesyri (Fenerbah\u00e7e, S\u00fcper Lig), Hakim Ziyech (Galatasaray, S\u00fcper Lig), Sofyan Amrabat (Real Betis, LaLiga), Nayef Aguerd (Real Sociedad, LaLiga) et Abdessamad Ezzalzouli (Real Betis, LaLiga) sont parmi les Lions de l\u2019Atlas suivis en d\u00e9tail \u00e0 chaque journ\u00e9e de leurs championnats respectifs.',
        },
      ],
    },
  ],
  faqs: [
    {
      question: 'O\u00f9 regarder les matchs de l\u2019\u00e9quipe du Maroc\u202f?',
      answer:
        'Les matchs des Lions de l\u2019Atlas sont diffus\u00e9s sur Arryadia TV (cha\u00eene publique marocaine) en clair. Certains matchs internationaux sont aussi diffus\u00e9s sur beIN Sports et sur les plateformes de streaming FIFA+ pour les comp\u00e9titions FIFA.',
    },
    {
      question: 'Quand sont les prochains matchs de la Botola Pro\u202f?',
      answer:
        'La saison 2025-26 se d\u00e9roule jusqu\u2019au 25 mai 2026. La prochaine journ\u00e9e est consultable en haut de cette page dans la section Matchs. La saison 2026-27 commencera le 15 ao\u00fbt 2026.',
    },
    {
      question: 'Quels Marocains jouent en UEFA Champions League\u202f?',
      answer:
        'Saison 2025-26\u202f: Achraf Hakimi (PSG), Brahim Diaz (Bayern Munich), Noussair Mazraoui (Manchester United, via Europa League), Bilal El Khannouss (Stuttgart). Hakimi est le capitaine du Maroc et l\u2019un des d\u00e9fenseurs les plus cot\u00e9s au monde \u00e0 son poste.',
    },
    {
      question: 'Comment fonctionne la Coupe du Monde 2026\u202f?',
      answer:
        'La Coupe du Monde 2026 r\u00e9unit 48 \u00e9quipes. Phase de groupes\u202f: 12 groupes de 4, les 2 premiers et les 8 meilleurs troisi\u00e8mes se qualifient pour les 32es de finale. La comp\u00e9tition se d\u00e9roule du 11 juin au 19 juillet 2026 aux \u00c9tats-Unis, au Canada et au Mexique.',
    },
    {
      question: 'Quand commence la WAFCON 2026 au Maroc\u202f?',
      answer:
        'La CAN F\u00e9minine 2026 (WAFCON) se d\u00e9roulera au Maroc du 25 juillet au 16 ao\u00fbt 2026, avec 16 \u00e9quipes (format \u00e9largi). La WAFCON 2024, remport\u00e9e par le Nigeria (3-2 en finale contre le Maroc), est \u00e9galement consultable sur Atlas Kings.',
    },
    {
      question: 'Qui sont les meilleurs buteurs de la Botola Pro\u202f?',
      answer:
        '\u00c0 la mi-saison 2025-26\u202f: Diasty (Wydad AC, 14 buts), Kasami (Raja CA, 12), M\u2019Hand (AS FAR, 9), El Idrissi (Maghreb F\u00e8s, 9), Naciri (OCS Settat, 8). Le classement complet est consultable sur la page de la Botola Pro.',
    },
    {
      question: 'Atlas Kings est-il gratuit\u202f?',
      answer:
        'Oui, Atlas Kings est enti\u00e8rement gratuit. Le site est financ\u00e9 par son mod\u00e8le \u00e9ditorial et ne diffuse pas de publicit\u00e9 conform\u00e9ment \u00e0 notre approche \u00e9ditoriale et \u00e0 la Loi 09-08 sur la protection des donn\u00e9es personnelles. Aucune inscription n\u2019est requise pour consulter les classements, scores ou statistiques.',
    },
    {
      question: 'Atlas Kings couvre-t-il le football f\u00e9minin\u202f?',
      answer:
        'Oui. Atlas Kings couvre l\u2019\u00e9quipe nationale f\u00e9minine du Maroc (Lionnes de l\u2019Atlas), la Botola Pro F\u00e9minine (cr\u00e9\u00e9e en 2017), la WAFCON 2024 (r\u00e9sultats) et la WAFCON 2026 (\u00e0 venir au Maroc), la Coupe du Monde f\u00e9minine, la UEFA Women\u2019s Champions League, et les principales ligues f\u00e9minines europ\u00e9ennes.',
    },
  ],
};

// ── English ──

const HOMEPAGE_EN: AboutContent = {
  cards: [
    {
      id: 'about-atlas-kings',
      heading: 'About Atlas Kings',
      blocks: [
        {
          type: 'prose',
          text: 'Atlas Kings is the go-to platform for Moroccan and international football. Launched in 2026, it covers 36+ competitions, 320+ clubs and 6,000+ players with real-time data, standings updated every matchday, and editorial coverage centred on football as seen from Morocco.',
        },
      ],
    },
    {
      id: 'competitions-covered',
      heading: 'Competitions covered',
      blocks: [
        {
          type: 'prose',
          text: 'Atlas Kings tracks Botola Pro (1st division), Botola Pro 2 and Coupe du Tr\u00f4ne in Morocco; CAF Champions League, CAF Confederation Cup, AFCON and WAFCON for Africa; FIFA World Cup 2026, FIFA qualifiers and the U-17 World Cup 2026; the Big Five European leagues (Premier League, LaLiga, Bundesliga, Serie A, Ligue 1); UEFA Champions League, Europa League and Conference League; and key MENA competitions (AFC Asian Cup, Saudi Pro League, Egyptian Premier).',
        },
      ],
    },
    {
      id: 'moroccan-football',
      heading: 'Moroccan football',
      blocks: [
        {
          type: 'prose',
          text: 'Botola Pro features 16 clubs, including the historic rivalry between Wydad AC and Raja CA \u2014 the Casablanca derby, the most-watched in North Africa. AS FAR, Maghreb F\u00e8s, Renaissance Berkane and Hassania Agadir round out the top of the table. The Morocco national team \u2014 the Atlas Lions \u2014 plays at Complexe Mohammed V in Rabat. On the continental stage, Wydad AC is the most decorated Moroccan club in the CAF Champions League with three titles.',
        },
      ],
    },
    {
      id: 'world-cup-2026',
      heading: 'FIFA World Cup 2026',
      blocks: [
        {
          type: 'prose',
          text: 'The 2026 FIFA World Cup brings 48 teams to the United States, Canada and Mexico \u2014 the first edition in this expanded format. Group stage: 12 groups of 4 teams; the top 2 from each group and the 8 best third-placed teams advance to the Round of 32. The tournament runs from June 11 to July 19, 2026. Morocco is in Group C alongside Argentina, Saudi Arabia and Egypt.',
        },
      ],
    },
    {
      id: 'moroccans-abroad',
      heading: 'Atlas Kings and Moroccans abroad',
      blocks: [
        {
          type: 'prose',
          text: 'Atlas Kings tracks Moroccan players performing in foreign leagues in detail. Achraf Hakimi (PSG, Ligue 1 & UCL), Brahim Diaz (Bayern Munich, Bundesliga & UCL), Noussair Mazraoui (Manchester United, Premier League), Youssef En-Nesyri (Fenerbah\u00e7e, S\u00fcper Lig), Hakim Ziyech (Galatasaray, S\u00fcper Lig), Sofyan Amrabat (Real Betis, LaLiga), Nayef Aguerd (Real Sociedad, LaLiga) and Abdessamad Ezzalzouli (Real Betis, LaLiga) are among the Atlas Lions covered every matchday in their respective leagues.',
        },
      ],
    },
  ],
  faqs: [
    {
      question: 'Where can I watch Morocco national team matches?',
      answer:
        'Atlas Lions matches are broadcast on Arryadia TV (Moroccan public channel) free-to-air. Some international fixtures are also available on beIN Sports and on FIFA+ streaming for FIFA competitions.',
    },
    {
      question: 'When are the next Botola Pro matches?',
      answer:
        'The 2025\u201326 season runs until 25 May 2026. The next matchday is shown at the top of this page in the Matches section. The 2026\u201327 season starts 15 August 2026.',
    },
    {
      question: 'Which Moroccans play in the UEFA Champions League?',
      answer:
        '2025\u201326 season: Achraf Hakimi (PSG), Brahim Diaz (Bayern Munich), Noussair Mazraoui (Manchester United, via Europa League), Bilal El Khannouss (Stuttgart). Hakimi is Morocco\u2019s captain and one of the most highly rated defenders in the world at his position.',
    },
    {
      question: 'How does the 2026 World Cup work?',
      answer:
        'The 2026 World Cup features 48 teams. Group stage: 12 groups of 4; the top 2 and the 8 best third-placed teams qualify for the Round of 32. The tournament runs from 11 June to 19 July 2026 in the United States, Canada and Mexico.',
    },
    {
      question: 'When does WAFCON 2026 start in Morocco?',
      answer:
        'WAFCON 2026 takes place in Morocco from 25 July to 16 August 2026, with 16 teams (expanded format). WAFCON 2024, won by Nigeria (3-2 in the final against Morocco), is also available on Atlas Kings.',
    },
    {
      question: 'Who are the top scorers in Botola Pro?',
      answer:
        'At the mid-point of the 2025\u201326 season: Diasty (Wydad AC, 14 goals), Kasami (Raja CA, 12), M\u2019Hand (AS FAR, 9), El Idrissi (Maghreb F\u00e8s, 9), Naciri (OCS Settat, 8). Full rankings are available on the Botola Pro page.',
    },
    {
      question: 'Is Atlas Kings free?',
      answer:
        'Yes, Atlas Kings is entirely free. The site is funded through its editorial model and does not run advertising, in line with our editorial approach and Morocco\u2019s Law 09-08 on personal data protection. No sign-up is required to view standings, scores or statistics.',
    },
    {
      question: 'Does Atlas Kings cover women\u2019s football?',
      answer:
        'Yes. Atlas Kings covers the Morocco women\u2019s national team (Atlas Lionesses), the Botola Pro F\u00e9minine (founded 2017), WAFCON 2024 (results) and WAFCON 2026 (upcoming in Morocco), the FIFA Women\u2019s World Cup, the UEFA Women\u2019s Champions League, and top European women\u2019s leagues.',
    },
  ],
};

// ── Arabic ──

const HOMEPAGE_AR: AboutContent = {
  cards: [
    {
      id: 'about-atlas-kings',
      heading: '\u062d\u0648\u0644 \u0623\u0637\u0644\u0633 \u0643\u064a\u0646\u063a\u0632',
      blocks: [
        {
          type: 'prose',
          text: '\u0623\u0637\u0644\u0633 \u0643\u064a\u0646\u063a\u0632 \u0647\u064a \u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0645\u0631\u062c\u0639\u064a\u0629 \u0644\u0643\u0631\u0629 \u0627\u0644\u0642\u062f\u0645 \u0627\u0644\u0645\u063a\u0631\u0628\u064a\u0629 \u0648\u0627\u0644\u062f\u0648\u0644\u064a\u0629. \u0623\u064f\u0637\u0644\u0642\u062a \u0641\u064a 2026\u060c \u0648\u062a\u063a\u0637\u064a \u0623\u0643\u062b\u0631 \u0645\u0646 36 \u0645\u0633\u0627\u0628\u0642\u0629 \u0648320+ \u0646\u0627\u062f\u064a\u064b\u0627 \u06486000+ \u0644\u0627\u0639\u0628 \u0628\u0628\u064a\u0627\u0646\u0627\u062a \u0645\u0628\u0627\u0634\u0631\u0629\u060c \u062a\u0631\u062a\u064a\u0628 \u0645\u062d\u062f\u062b \u0643\u0644 \u062c\u0648\u0644\u0629\u060c \u0648\u062a\u063a\u0637\u064a\u0629 \u062a\u062d\u0631\u064a\u0631\u064a\u0629 \u062a\u0631\u0643\u0632 \u0639\u0644\u0649 \u0643\u0631\u0629 \u0627\u0644\u0642\u062f\u0645 \u0645\u0646 \u0645\u0646\u0638\u0648\u0631 \u0645\u063a\u0631\u0628\u064a.',
        },
      ],
    },
    {
      id: 'competitions-covered',
      heading:
        '\u0627\u0644\u0645\u0633\u0627\u0628\u0642\u0627\u062a \u0627\u0644\u0645\u063a\u0637\u0627\u0629',
      blocks: [
        {
          type: 'prose',
          text: '\u062a\u062a\u0627\u0628\u0639 \u0623\u0637\u0644\u0633 \u0643\u064a\u0646\u063a\u0632 \u0627\u0644\u0628\u0637\u0648\u0644\u0629 \u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629 (\u0627\u0644\u0642\u0633\u0645 \u0627\u0644\u0623\u0648\u0644) \u0648\u0627\u0644\u0642\u0633\u0645 \u0627\u0644\u062b\u0627\u0646\u064a \u0648\u0643\u0623\u0633 \u0627\u0644\u0639\u0631\u0634 \u0641\u064a \u0627\u0644\u0645\u063a\u0631\u0628\u061b \u062f\u0648\u0631\u064a \u0623\u0628\u0637\u0627\u0644 \u0623\u0641\u0631\u064a\u0642\u064a\u0627 \u0648\u0643\u0623\u0633 \u0627\u0644\u0643\u0648\u0646\u0641\u062f\u0631\u0627\u0644\u064a\u0629 \u0648\u0643\u0623\u0633 \u0623\u0645\u0645 \u0625\u0641\u0631\u064a\u0642\u064a\u0627 \u0648\u0643\u0623\u0633 \u0623\u0645\u0645 \u0625\u0641\u0631\u064a\u0642\u064a\u0627 \u0644\u0644\u0633\u064a\u062f\u0627\u062a\u061b \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026 \u0648\u062a\u0635\u0641\u064a\u0627\u062a \u0641\u064a\u0641\u0627 \u0648\u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 \u062a\u062d\u062a 17 \u0633\u0646\u0629\u061b \u0627\u0644\u062f\u0648\u0631\u064a\u0627\u062a \u0627\u0644\u0623\u0648\u0631\u0648\u0628\u064a\u0629 \u0627\u0644\u0643\u0628\u0631\u0649 (\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u060c \u0627\u0644\u0625\u0633\u0628\u0627\u0646\u064a\u060c \u0627\u0644\u0623\u0644\u0645\u0627\u0646\u064a\u060c \u0627\u0644\u0625\u064a\u0637\u0627\u0644\u064a\u060c \u0627\u0644\u0641\u0631\u0646\u0633\u064a)\u061b \u062f\u0648\u0631\u064a \u0623\u0628\u0637\u0627\u0644 \u0623\u0648\u0631\u0648\u0628\u0627 \u0648\u0627\u0644\u062f\u0648\u0631\u064a \u0627\u0644\u0623\u0648\u0631\u0648\u0628\u064a \u0648\u062f\u0648\u0631\u064a \u0627\u0644\u0645\u0624\u062a\u0645\u0631\u061b \u0648\u0627\u0644\u0645\u0633\u0627\u0628\u0642\u0627\u062a \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629 \u0641\u064a \u0627\u0644\u0634\u0631\u0642 \u0627\u0644\u0623\u0648\u0633\u0637.',
        },
      ],
    },
    {
      id: 'moroccan-football',
      heading:
        '\u0643\u0631\u0629 \u0627\u0644\u0642\u062f\u0645 \u0627\u0644\u0645\u063a\u0631\u0628\u064a\u0629',
      blocks: [
        {
          type: 'prose',
          text: '\u062a\u0636\u0645 \u0627\u0644\u0628\u0637\u0648\u0644\u0629 \u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629 16 \u0646\u0627\u062f\u064a\u064b\u0627\u060c \u0628\u0645\u0627 \u0641\u064a\u0647\u0627 \u0627\u0644\u0645\u0646\u0627\u0641\u0633\u0629 \u0627\u0644\u062a\u0627\u0631\u064a\u062e\u064a\u0629 \u0628\u064a\u0646 \u0627\u0644\u0648\u062f\u0627\u062f \u0627\u0644\u0631\u064a\u0627\u0636\u064a \u0648\u0627\u0644\u0631\u062c\u0627\u0621 \u0627\u0644\u0631\u064a\u0627\u0636\u064a \u2014 \u062f\u0631\u0628\u064a \u0627\u0644\u062f\u0627\u0631 \u0627\u0644\u0628\u064a\u0636\u0627\u0621 \u0627\u0644\u0623\u0643\u062b\u0631 \u0645\u062a\u0627\u0628\u0639\u0629 \u0641\u064a \u0634\u0645\u0627\u0644 \u0625\u0641\u0631\u064a\u0642\u064a\u0627. \u0627\u0644\u062c\u064a\u0634 \u0627\u0644\u0645\u0644\u0643\u064a \u0648\u0627\u0644\u0645\u063a\u0631\u0628 \u0627\u0644\u0641\u0627\u0633\u064a \u0648\u0646\u0647\u0636\u0629 \u0628\u0631\u0643\u0627\u0646 \u0648\u062d\u0633\u0646\u064a\u0629 \u0623\u0643\u0627\u062f\u064a\u0631 \u064a\u0643\u0645\u0644\u0648\u0646 \u0635\u062f\u0627\u0631\u0629 \u0627\u0644\u062a\u0631\u062a\u064a\u0628. \u064a\u0644\u0639\u0628 \u0627\u0644\u0645\u0646\u062a\u062e\u0628 \u0627\u0644\u0645\u063a\u0631\u0628\u064a \u2014 \u0623\u0633\u0648\u062f \u0627\u0644\u0623\u0637\u0644\u0633 \u2014 \u0645\u0628\u0627\u0631\u064a\u0627\u062a\u0647 \u0641\u064a \u0645\u0631\u0643\u0628 \u0645\u062d\u0645\u062f \u0627\u0644\u062e\u0627\u0645\u0633 \u0628\u0627\u0644\u0631\u0628\u0627\u0637. \u0639\u0644\u0649 \u0627\u0644\u0635\u0639\u064a\u062f \u0627\u0644\u0642\u0627\u0631\u064a\u060c \u0627\u0644\u0648\u062f\u0627\u062f \u0647\u0648 \u0627\u0644\u0646\u0627\u062f\u064a \u0627\u0644\u0645\u063a\u0631\u0628\u064a \u0627\u0644\u0623\u0643\u062b\u0631 \u062a\u062a\u0648\u064a\u062c\u064b\u0627 \u0641\u064a \u062f\u0648\u0631\u064a \u0623\u0628\u0637\u0627\u0644 \u0623\u0641\u0631\u064a\u0642\u064a\u0627 \u0628\u062b\u0644\u0627\u062b \u0623\u0644\u0642\u0627\u0628.',
        },
      ],
    },
    {
      id: 'world-cup-2026',
      heading: '\u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026',
      blocks: [
        {
          type: 'prose',
          text: '\u062a\u062c\u0645\u0639 \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 \u0641\u064a\u0641\u0627 2026 48 \u0645\u0646\u062a\u062e\u0628\u064b\u0627 \u0641\u064a \u0627\u0644\u0648\u0644\u0627\u064a\u0627\u062a \u0627\u0644\u0645\u062a\u062d\u062f\u0629 \u0648\u0643\u0646\u062f\u0627 \u0648\u0627\u0644\u0645\u0643\u0633\u064a\u0643 \u2014 \u0623\u0648\u0644 \u0646\u0633\u062e\u0629 \u0628\u0647\u0630\u0627 \u0627\u0644\u0634\u0643\u0644 \u0627\u0644\u0645\u0648\u0633\u0639. \u0645\u0631\u062d\u0644\u0629 \u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0627\u062a: 12 \u0645\u062c\u0645\u0648\u0639\u0629 \u0645\u0646 4 \u0641\u0631\u0642\u060c \u064a\u062a\u0623\u0647\u0644 \u0627\u0644\u0623\u0648\u0644\u0627\u0646 \u0645\u0646 \u0643\u0644 \u0645\u062c\u0645\u0648\u0639\u0629 \u0648\u0623\u0641\u0636\u0644 8 \u0641\u0631\u0642 \u062b\u0627\u0644\u062b\u0629 \u0644\u062f\u0648\u0631 \u0627\u0644\u064032. \u062a\u0642\u0627\u0645 \u0627\u0644\u0628\u0637\u0648\u0644\u0629 \u0645\u0646 11 \u064a\u0648\u0646\u064a\u0648 \u0625\u0644\u0649 19 \u064a\u0648\u0644\u064a\u0648 2026. \u0627\u0644\u0645\u063a\u0631\u0628 \u0641\u064a \u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0629 C \u0645\u0639 \u0627\u0644\u0623\u0631\u062c\u0646\u062a\u064a\u0646 \u0648\u0627\u0644\u0633\u0639\u0648\u062f\u064a\u0629 \u0648\u0645\u0635\u0631.',
        },
      ],
    },
    {
      id: 'moroccans-abroad',
      heading:
        '\u0623\u0637\u0644\u0633 \u0643\u064a\u0646\u063a\u0632 \u0648\u0627\u0644\u0645\u063a\u0627\u0631\u0628\u0629 \u0641\u064a \u0627\u0644\u062e\u0627\u0631\u062c',
      blocks: [
        {
          type: 'prose',
          text: '\u062a\u062a\u0627\u0628\u0639 \u0623\u0637\u0644\u0633 \u0643\u064a\u0646\u063a\u0632 \u0623\u062f\u0627\u0621 \u0627\u0644\u0644\u0627\u0639\u0628\u064a\u0646 \u0627\u0644\u0645\u063a\u0627\u0631\u0628\u0629 \u0641\u064a \u0627\u0644\u062f\u0648\u0631\u064a\u0627\u062a \u0627\u0644\u0623\u062c\u0646\u0628\u064a\u0629 \u0628\u0627\u0644\u062a\u0641\u0635\u064a\u0644. \u0623\u0634\u0631\u0641 \u062d\u0643\u064a\u0645\u064a (\u0628\u0627\u0631\u064a\u0633 \u0633\u0627\u0646 \u062c\u064a\u0631\u0645\u0627\u0646\u060c \u0627\u0644\u062f\u0648\u0631\u064a \u0627\u0644\u0641\u0631\u0646\u0633\u064a \u0648\u062f\u0648\u0631\u064a \u0627\u0644\u0623\u0628\u0637\u0627\u0644)\u060c \u0625\u0628\u0631\u0627\u0647\u064a\u0645 \u062f\u064a\u0627\u0632 (\u0628\u0627\u064a\u0631\u0646 \u0645\u064a\u0648\u0646\u064a\u062e\u060c \u0627\u0644\u062f\u0648\u0631\u064a \u0627\u0644\u0623\u0644\u0645\u0627\u0646\u064a)\u060c \u0646\u0635\u064a\u0631 \u0645\u0632\u0631\u0627\u0648\u064a (\u0645\u0627\u0646\u0634\u0633\u062a\u0631 \u064a\u0648\u0646\u0627\u064a\u062a\u062f\u060c \u0627\u0644\u062f\u0648\u0631\u064a \u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a)\u060c \u064a\u0648\u0633\u0641 \u0627\u0644\u0646\u0635\u064a\u0631\u064a (\u0641\u0646\u0631\u0628\u062e\u0634\u0629\u060c \u0627\u0644\u062f\u0648\u0631\u064a \u0627\u0644\u062a\u0631\u0643\u064a)\u060c \u062d\u0643\u064a\u0645 \u0632\u064a\u0627\u0634 (\u063a\u0644\u0637\u0629 \u0633\u0631\u0627\u064a)\u060c \u0633\u0641\u064a\u0627\u0646 \u0623\u0645\u0631\u0627\u0628\u0637 (\u0631\u064a\u0627\u0644 \u0628\u064a\u062a\u064a\u0633\u060c \u0627\u0644\u062f\u0648\u0631\u064a \u0627\u0644\u0625\u0633\u0628\u0627\u0646\u064a)\u060c \u0646\u0627\u064a\u0641 \u0623\u0643\u0631\u062f (\u0631\u064a\u0627\u0644 \u0633\u0648\u0633\u064a\u062f\u0627\u062f) \u0648\u0639\u0628\u062f \u0627\u0644\u0635\u0645\u062f \u0627\u0644\u0632\u0644\u0632\u0648\u0644\u064a (\u0631\u064a\u0627\u0644 \u0628\u064a\u062a\u064a\u0633) \u0645\u0646 \u0628\u064a\u0646 \u0623\u0633\u0648\u062f \u0627\u0644\u0623\u0637\u0644\u0633 \u0627\u0644\u0645\u062a\u0627\u0628\u0639\u064a\u0646 \u0643\u0644 \u062c\u0648\u0644\u0629.',
        },
      ],
    },
  ],
  faqs: [
    {
      question:
        '\u0623\u064a\u0646 \u064a\u0645\u0643\u0646 \u0645\u0634\u0627\u0647\u062f\u0629 \u0645\u0628\u0627\u0631\u064a\u0627\u062a \u0627\u0644\u0645\u0646\u062a\u062e\u0628 \u0627\u0644\u0645\u063a\u0631\u0628\u064a\u061f',
      answer:
        '\u062a\u064f\u0628\u062b \u0645\u0628\u0627\u0631\u064a\u0627\u062a \u0623\u0633\u0648\u062f \u0627\u0644\u0623\u0637\u0644\u0633 \u0639\u0644\u0649 \u0642\u0646\u0627\u0629 \u0627\u0644\u0631\u064a\u0627\u0636\u064a\u0629 (\u0627\u0644\u0642\u0646\u0627\u0629 \u0627\u0644\u0639\u0645\u0648\u0645\u064a\u0629 \u0627\u0644\u0645\u063a\u0631\u0628\u064a\u0629) \u0645\u062c\u0627\u0646\u064b\u0627. \u0628\u0639\u0636 \u0627\u0644\u0645\u0628\u0627\u0631\u064a\u0627\u062a \u0627\u0644\u062f\u0648\u0644\u064a\u0629 \u0645\u062a\u0627\u062d\u0629 \u0623\u064a\u0636\u064b\u0627 \u0639\u0644\u0649 beIN Sports \u0648\u0645\u0646\u0635\u0629 FIFA+ \u0644\u0645\u0633\u0627\u0628\u0642\u0627\u062a \u0641\u064a\u0641\u0627.',
    },
    {
      question:
        '\u0645\u062a\u0649 \u0645\u0648\u0627\u0639\u064a\u062f \u0645\u0628\u0627\u0631\u064a\u0627\u062a \u0627\u0644\u0628\u0637\u0648\u0644\u0629 \u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629 \u0627\u0644\u0642\u0627\u062f\u0645\u0629\u061f',
      answer:
        '\u064a\u0645\u062a\u062f \u0645\u0648\u0633\u0645 2025-26 \u062d\u062a\u0649 25 \u0645\u0627\u064a 2026. \u0627\u0644\u062c\u0648\u0644\u0629 \u0627\u0644\u0642\u0627\u062f\u0645\u0629 \u0645\u0639\u0631\u0648\u0636\u0629 \u0641\u064a \u0623\u0639\u0644\u0649 \u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062d\u0629 \u0641\u064a \u0642\u0633\u0645 \u0627\u0644\u0645\u0628\u0627\u0631\u064a\u0627\u062a. \u064a\u0628\u062f\u0623 \u0645\u0648\u0633\u0645 2026-27 \u0641\u064a 15 \u0623\u063a\u0633\u0637\u0633 2026.',
    },
    {
      question:
        '\u0645\u0646 \u0647\u0645 \u0627\u0644\u0645\u063a\u0627\u0631\u0628\u0629 \u0641\u064a \u062f\u0648\u0631\u064a \u0623\u0628\u0637\u0627\u0644 \u0623\u0648\u0631\u0648\u0628\u0627\u061f',
      answer:
        '\u0645\u0648\u0633\u0645 2025-26: \u0623\u0634\u0631\u0641 \u062d\u0643\u064a\u0645\u064a (\u0628\u0627\u0631\u064a\u0633 \u0633\u0627\u0646 \u062c\u064a\u0631\u0645\u0627\u0646)\u060c \u0625\u0628\u0631\u0627\u0647\u064a\u0645 \u062f\u064a\u0627\u0632 (\u0628\u0627\u064a\u0631\u0646 \u0645\u064a\u0648\u0646\u064a\u062e)\u060c \u0646\u0635\u064a\u0631 \u0645\u0632\u0631\u0627\u0648\u064a (\u0645\u0627\u0646\u0634\u0633\u062a\u0631 \u064a\u0648\u0646\u0627\u064a\u062a\u062f\u060c \u0639\u0628\u0631 \u0627\u0644\u062f\u0648\u0631\u064a \u0627\u0644\u0623\u0648\u0631\u0648\u0628\u064a)\u060c \u0628\u0644\u0627\u0644 \u0627\u0644\u062e\u0646\u0648\u0633 (\u0634\u062a\u0648\u062a\u063a\u0627\u0631\u062a). \u062d\u0643\u064a\u0645\u064a \u0642\u0627\u0626\u062f \u0627\u0644\u0645\u063a\u0631\u0628 \u0648\u0623\u062d\u062f \u0623\u0641\u0636\u0644 \u0627\u0644\u0645\u062f\u0627\u0641\u0639\u064a\u0646 \u0641\u064a \u0627\u0644\u0639\u0627\u0644\u0645.',
    },
    {
      question:
        '\u0643\u064a\u0641 \u064a\u0639\u0645\u0644 \u0646\u0638\u0627\u0645 \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026\u061f',
      answer:
        '\u062a\u0636\u0645 \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026 48 \u0645\u0646\u062a\u062e\u0628\u064b\u0627. \u0645\u0631\u062d\u0644\u0629 \u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0627\u062a: 12 \u0645\u062c\u0645\u0648\u0639\u0629 \u0645\u0646 4\u060c \u064a\u062a\u0623\u0647\u0644 \u0627\u0644\u0623\u0648\u0644\u0627\u0646 \u0648\u0623\u0641\u0636\u0644 8 \u062b\u0648\u0627\u0644\u062b \u0644\u062f\u0648\u0631 \u0627\u0644\u064032. \u062a\u0642\u0627\u0645 \u0645\u0646 11 \u064a\u0648\u0646\u064a\u0648 \u0625\u0644\u0649 19 \u064a\u0648\u0644\u064a\u0648 2026 \u0641\u064a \u0627\u0644\u0648\u0644\u0627\u064a\u0627\u062a \u0627\u0644\u0645\u062a\u062d\u062f\u0629 \u0648\u0643\u0646\u062f\u0627 \u0648\u0627\u0644\u0645\u0643\u0633\u064a\u0643.',
    },
    {
      question:
        '\u0645\u062a\u0649 \u062a\u0628\u062f\u0623 \u0643\u0623\u0633 \u0623\u0645\u0645 \u0625\u0641\u0631\u064a\u0642\u064a\u0627 \u0644\u0644\u0633\u064a\u062f\u0627\u062a 2026 \u0641\u064a \u0627\u0644\u0645\u063a\u0631\u0628\u061f',
      answer:
        '\u0633\u062a\u0642\u0627\u0645 \u0643\u0623\u0633 \u0623\u0645\u0645 \u0625\u0641\u0631\u064a\u0642\u064a\u0627 \u0644\u0644\u0633\u064a\u062f\u0627\u062a 2026 \u0641\u064a \u0627\u0644\u0645\u063a\u0631\u0628 \u0645\u0646 25 \u064a\u0648\u0644\u064a\u0648 \u0625\u0644\u0649 16 \u0623\u063a\u0633\u0637\u0633 2026\u060c \u0628\u0645\u0634\u0627\u0631\u0643\u0629 16 \u0645\u0646\u062a\u062e\u0628\u064b\u0627 (\u0635\u064a\u063a\u0629 \u0645\u0648\u0633\u0639\u0629). \u0646\u0633\u062e\u0629 2024\u060c \u0627\u0644\u062a\u064a \u0641\u0627\u0632\u062a \u0628\u0647\u0627 \u0646\u064a\u062c\u064a\u0631\u064a\u0627 (3-2 \u0636\u062f \u0627\u0644\u0645\u063a\u0631\u0628)\u060c \u0645\u062a\u0627\u062d\u0629 \u0623\u064a\u0636\u064b\u0627 \u0639\u0644\u0649 \u0623\u0637\u0644\u0633 \u0643\u064a\u0646\u063a\u0632.',
    },
    {
      question:
        '\u0645\u0646 \u0647\u0645 \u0623\u0641\u0636\u0644 \u0647\u062f\u0627\u0641\u064a \u0627\u0644\u0628\u0637\u0648\u0644\u0629 \u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629\u061f',
      answer:
        '\u0641\u064a \u0645\u0646\u062a\u0635\u0641 \u0645\u0648\u0633\u0645 2025-26: \u062f\u064a\u0627\u0633\u062a\u064a (\u0627\u0644\u0648\u062f\u0627\u062f\u060c 14 \u0647\u062f\u0641\u064b\u0627)\u060c \u0643\u0627\u0633\u0627\u0645\u064a (\u0627\u0644\u0631\u062c\u0627\u0621\u060c 12)\u060c \u0645\u062d\u0646\u062f (\u0627\u0644\u062c\u064a\u0634 \u0627\u0644\u0645\u0644\u0643\u064a\u060c 9)\u060c \u0627\u0644\u0625\u062f\u0631\u064a\u0633\u064a (\u0627\u0644\u0645\u063a\u0631\u0628 \u0627\u0644\u0641\u0627\u0633\u064a\u060c 9)\u060c \u0646\u0627\u0635\u0631\u064a (\u0623\u0648\u0644\u0645\u0628\u064a\u0643 \u0622\u0633\u0641\u064a\u060c 8). \u0627\u0644\u062a\u0631\u062a\u064a\u0628 \u0627\u0644\u0643\u0627\u0645\u0644 \u0645\u062a\u0627\u062d \u0641\u064a \u0635\u0641\u062d\u0629 \u0627\u0644\u0628\u0637\u0648\u0644\u0629 \u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629.',
    },
    {
      question:
        '\u0647\u0644 \u0623\u0637\u0644\u0633 \u0643\u064a\u0646\u063a\u0632 \u0645\u062c\u0627\u0646\u064a\u061f',
      answer:
        '\u0646\u0639\u0645\u060c \u0623\u0637\u0644\u0633 \u0643\u064a\u0646\u063a\u0632 \u0645\u062c\u0627\u0646\u064a \u0628\u0627\u0644\u0643\u0627\u0645\u0644. \u0627\u0644\u0645\u0648\u0642\u0639 \u0645\u0645\u0648\u0644 \u0628\u0646\u0645\u0648\u0630\u062c\u0647 \u0627\u0644\u062a\u062d\u0631\u064a\u0631\u064a \u0648\u0644\u0627 \u064a\u0639\u0631\u0636 \u0625\u0639\u0644\u0627\u0646\u0627\u062a\u060c \u0648\u0641\u0642\u064b\u0627 \u0644\u0646\u0647\u062c\u0646\u0627 \u0627\u0644\u062a\u062d\u0631\u064a\u0631\u064a \u0648\u0627\u0644\u0642\u0627\u0646\u0648\u0646 09-08 \u0644\u062d\u0645\u0627\u064a\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0634\u062e\u0635\u064a\u0629. \u0644\u0627 \u062a\u062a\u0637\u0644\u0628 \u0627\u0644\u062a\u0633\u062c\u064a\u0644 \u0644\u0639\u0631\u0636 \u0627\u0644\u062a\u0631\u062a\u064a\u0628 \u0648\u0627\u0644\u0646\u062a\u0627\u0626\u062c \u0648\u0627\u0644\u0625\u062d\u0635\u0627\u0626\u064a\u0627\u062a.',
    },
    {
      question:
        '\u0647\u0644 \u064a\u063a\u0637\u064a \u0623\u0637\u0644\u0633 \u0643\u064a\u0646\u063a\u0632 \u0643\u0631\u0629 \u0627\u0644\u0642\u062f\u0645 \u0627\u0644\u0646\u0633\u0627\u0626\u064a\u0629\u061f',
      answer:
        '\u0646\u0639\u0645. \u064a\u063a\u0637\u064a \u0623\u0637\u0644\u0633 \u0643\u064a\u0646\u063a\u0632 \u0627\u0644\u0645\u0646\u062a\u062e\u0628 \u0627\u0644\u0645\u063a\u0631\u0628\u064a \u0644\u0644\u0633\u064a\u062f\u0627\u062a (\u0644\u0628\u0624\u0627\u062a \u0627\u0644\u0623\u0637\u0644\u0633)\u060c \u0627\u0644\u0628\u0637\u0648\u0644\u0629 \u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629 \u0627\u0644\u0646\u0633\u0627\u0626\u064a\u0629 (\u062a\u0623\u0633\u0633\u062a 2017)\u060c \u0643\u0623\u0633 \u0623\u0645\u0645 \u0625\u0641\u0631\u064a\u0642\u064a\u0627 \u0644\u0644\u0633\u064a\u062f\u0627\u062a 2024 (\u0627\u0644\u0646\u062a\u0627\u0626\u062c) \u0648\u0646\u0633\u062e\u0629 2026 (\u0642\u0627\u062f\u0645\u0629 \u0641\u064a \u0627\u0644\u0645\u063a\u0631\u0628)\u060c \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 \u0644\u0644\u0633\u064a\u062f\u0627\u062a\u060c \u062f\u0648\u0631\u064a \u0623\u0628\u0637\u0627\u0644 \u0623\u0648\u0631\u0648\u0628\u0627 \u0644\u0644\u0633\u064a\u062f\u0627\u062a\u060c \u0648\u0627\u0644\u062f\u0648\u0631\u064a\u0627\u062a \u0627\u0644\u0646\u0633\u0627\u0626\u064a\u0629 \u0627\u0644\u0623\u0648\u0631\u0648\u0628\u064a\u0629 \u0627\u0644\u0643\u0628\u0631\u0649.',
    },
  ],
};

// ── Registry ──

const HOMEPAGE_ABOUT_REGISTRY: Record<Locale, AboutContent> = {
  fr: HOMEPAGE_FR,
  en: HOMEPAGE_EN,
  ar: HOMEPAGE_AR,
};

export function getHomepageAboutContent(locale: Locale): AboutContent {
  return HOMEPAGE_ABOUT_REGISTRY[locale];
}
