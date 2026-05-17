/**
 * Per-locale About card content for WC 2026.
 *
 * Chunk A (Sub-task 6.7): typed content blocks with EN text for 12 thematic cards.
 * FR and AR use legacy shape until Chunk C migrates them to the new structure.
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

// ── Content block types ──

export interface ProseBlock {
  type: 'prose';
  text: string;
}

export interface TableBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface ListBlock {
  type: 'list';
  items: string[];
  ordered?: boolean;
}

export interface StatCardBlock {
  type: 'stat-card';
  label: string;
  value: string;
}

export interface TimelineBlock {
  type: 'timeline';
  events: { date: string; label: string; detail?: string }[];
}

export interface CalloutBlock {
  type: 'callout';
  variant: 'info' | 'warning';
  text: string;
}

export type ContentBlock =
  | ProseBlock
  | TableBlock
  | ListBlock
  | StatCardBlock
  | TimelineBlock
  | CalloutBlock;

// ── Card + content shapes ──

export interface AboutCard {
  id: string;
  heading: string | null;
  blocks: ContentBlock[];
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface AboutContent {
  cards: AboutCard[];
  faqs: FaqEntry[];
}

// Legacy shape for FR/AR until Chunk C migration
export interface LegacyAboutContent {
  sections: { heading: string; body: string }[];
  faqs: FaqEntry[];
}

// ── EN content ──

const WC_2026_EN: AboutContent = {
  cards: [
    // 1. QuickFactsStrip
    {
      id: 'quick-facts',
      heading: null,
      blocks: [
        { type: 'stat-card', label: 'Teams', value: '48' },
        { type: 'stat-card', label: 'Groups', value: '12' },
        { type: 'stat-card', label: 'Matches', value: '104' },
        { type: 'stat-card', label: 'Venues', value: '16' },
        { type: 'stat-card', label: 'Dates', value: 'Jun 11 \u2013 Jul 19' },
        { type: 'stat-card', label: 'Duration', value: '39 days' },
      ],
    },

    // 2. about-format
    {
      id: 'about-format',
      heading: 'The 48-team format',
      blocks: [
        {
          type: 'prose',
          text: 'The 2026 World Cup is the first to feature 48 teams, up from 32. Teams are divided into 12 groups of 4. Each team plays 3 group-stage matches. The top 2 from each group (24 teams) plus the 8 best third-placed teams advance to a 32-team knockout bracket.',
        },
        {
          type: 'prose',
          text: 'The knockout stage begins with the Round of 32, followed by the Round of 16, quarter-finals, semi-finals, third-place play-off, and the final. Extra time and penalty shootouts apply in all knockout matches.',
        },
        {
          type: 'table',
          headers: ['Priority', 'Tiebreaker criterion'],
          rows: [
            ['1', 'Points (3 for a win, 1 for a draw)'],
            ['2', 'Goal difference'],
            ['3', 'Goals scored'],
            ['4', 'Head-to-head points'],
            ['5', 'Head-to-head goal difference'],
            ['6', 'Head-to-head goals scored'],
            ['7', 'Fair play points (yellow/red cards)'],
            ['8', 'Drawing of lots by FIFA'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'Compared to 2022: 16 more teams, 40 more matches, the new Round of 32, and a best-third-placed qualification path that rewards competitive third-place finishes.',
        },
      ],
    },

    // 3. about-venues
    {
      id: 'about-venues',
      heading: 'Host cities and stadiums',
      blocks: [
        {
          type: 'prose',
          text: 'Matches are played across 16 stadiums in 3 countries. The United States hosts the majority with 11 venues, Mexico contributes 3, and Canada 2. The final takes place at MetLife Stadium in New Jersey.',
        },
        {
          type: 'table',
          headers: ['City', 'Country', 'Stadium', 'Capacity'],
          rows: [
            ['New York/NJ', 'USA', 'MetLife Stadium', '82,500'],
            ['Los Angeles', 'USA', 'SoFi Stadium', '70,240'],
            ['Dallas', 'USA', 'AT&T Stadium', '80,000'],
            ['Boston/Foxborough', 'USA', 'Gillette Stadium', '65,878'],
            ['Houston', 'USA', 'NRG Stadium', '72,220'],
            ['Miami', 'USA', 'Hard Rock Stadium', '64,767'],
            ['Philadelphia', 'USA', 'Lincoln Financial Field', '69,176'],
            ['Seattle', 'USA', 'Lumen Field', '68,740'],
            ['Atlanta', 'USA', 'Mercedes-Benz Stadium', '71,000'],
            ['San Francisco', 'USA', "Levi's Stadium", '68,500'],
            ['Kansas City', 'USA', 'Arrowhead Stadium', '76,416'],
            ['Mexico City', 'Mexico', 'Estadio Azteca', '87,523'],
            ['Guadalajara', 'Mexico', 'Estadio Akron', '49,850'],
            ['Monterrey', 'Mexico', 'Estadio BBVA', '53,500'],
            ['Toronto', 'Canada', 'BMO Field', '45,736'],
            ['Vancouver', 'Canada', 'BC Place', '54,500'],
          ],
        },
      ],
    },

    // 4. about-morocco
    {
      id: 'about-morocco',
      heading: 'Morocco at the World Cup',
      blocks: [
        {
          type: 'prose',
          text: 'Morocco enters the 2026 World Cup in Group C alongside Brazil, Haiti, and Scotland. The Atlas Lions carry the momentum of their historic 2022 campaign in Qatar, where they became the first African and Arab nation to reach a World Cup semi-final, finishing 4th.',
        },
        {
          type: 'prose',
          text: "The current squad blends experience and youth. Achraf Hakimi, Noussair Mazraoui, and Sofyan Amrabat anchor the spine, while a new generation pushes for places. Manager Walid Regragui's counter-attacking system and organized defense remain the team's hallmarks.",
        },
        {
          type: 'prose',
          text: 'Beyond 2026, Morocco will co-host the 2030 World Cup with Spain and Portugal, becoming the first African nation to host the tournament. The diaspora community across Europe and North America is expected to turn Group C venues into home atmospheres.',
        },
        {
          type: 'timeline',
          events: [
            {
              date: 'Jun 13, 2026',
              label: 'Brazil vs Morocco',
              detail: 'Group C, Matchday 1',
            },
            {
              date: 'Jun 18, 2026',
              label: 'Morocco vs Haiti',
              detail: 'Group C, Matchday 2',
            },
            {
              date: 'Jun 22, 2026',
              label: 'Scotland vs Morocco',
              detail: 'Group C, Matchday 3',
            },
          ],
        },
      ],
    },

    // 5. about-teams
    {
      id: 'about-teams',
      heading: 'Qualified teams',
      blocks: [
        {
          type: 'prose',
          text: 'The expanded 48-team format brings unprecedented global representation. Africa and Asia received additional slots, and several nations qualify for the first time in their history.',
        },
        {
          type: 'list',
          items: [
            'Debutants: Indonesia, Cape Verde, Cura\u00e7ao, Tanzania',
            'Long-awaited returns: Scotland (28 years), Iraq (40+ years)',
            'Africa: 9 teams (up from 5 in 2022)',
            'Asia: 8 teams (up from 6 in 2022)',
            'Europe: 16 teams',
            'South America: 6 teams',
            'North/Central America & Caribbean: 6 teams (incl. 3 hosts)',
            'Oceania: 1 team (New Zealand)',
          ],
        },
      ],
    },

    // 6. about-storylines
    {
      id: 'about-storylines',
      heading: 'Storylines to watch',
      blocks: [
        {
          type: 'prose',
          text: 'The 2026 World Cup arrives at a pivotal moment in football. The expanded format promises wider global participation but raises questions about competitive balance across 104 matches.',
        },
        {
          type: 'list',
          items: [
            "Messi and Ronaldo's likely final World Cup appearances, closing an era that defined the sport for two decades",
            "Argentina's bid to defend their 2022 title under Lionel Scaloni, chasing back-to-back championships",
            'The first tri-nation hosted World Cup, spanning 5,000 km from Vancouver to Mexico City',
            "Morocco's momentum: can the 2022 semi-finalists go further in a group with Brazil?",
            'Debut nations facing established powers for the first time on the world stage',
          ],
        },
      ],
    },

    // 7. about-tickets
    {
      id: 'about-tickets',
      heading: 'Tickets and hospitality',
      blocks: [
        {
          type: 'prose',
          text: 'FIFA manages all ticket sales through its official platform. Prices vary by match category, stadium location, and tournament stage.',
        },
        {
          type: 'list',
          items: [
            'Category 4 (group stage): from ~$60 USD',
            'Category 1 (group stage): from ~$300 USD',
            'Knockout rounds: from ~$150 to $600+ USD depending on stage',
            'Final: from ~$600 to $1,800+ USD',
            'Hospitality packages via On Location (FIFA official partner): premium seating, lounges, and travel bundles',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Only purchase tickets from FIFA.com/tickets or authorized resellers. Third-party marketplaces carry the risk of counterfeit tickets and inflated prices. FIFA has cancelled tickets obtained through unauthorized channels in past tournaments.',
        },
      ],
    },

    // 8. about-watch
    {
      id: 'about-watch',
      heading: 'Live on TV and streaming',
      blocks: [
        {
          type: 'prose',
          text: 'The 2026 World Cup will be broadcast globally. FIFA+ offers free streaming of select matches worldwide. Regional broadcasters hold exclusive rights by territory.',
        },
        {
          type: 'table',
          headers: ['Region', 'Broadcaster(s)'],
          rows: [
            ['Morocco', 'Arryadia TV, SNRT (free-to-air), beIN Sports MENA'],
            ['France', 'TF1, beIN Sports'],
            ['USA / Canada', 'FOX, Telemundo, TSN / RDS'],
            ['UK', 'BBC, ITV'],
            ['MENA', 'beIN Sports'],
            ['Sub-Saharan Africa', 'SuperSport, Canal+'],
            ['Latin America', 'Televisa, DIRECTV Sports'],
            ['Asia', 'Sony Sports (India), various per country'],
            ['Global (free)', 'FIFA+ (select matches)'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'Moroccan diaspora tip: beIN Sports MENA and Arryadia are available via satellite and IPTV across Europe and North America. Check local providers for availability. All matches kick off between 12:00 and 21:00 Eastern Time.',
        },
      ],
    },

    // 9. about-travel
    {
      id: 'about-travel',
      heading: 'Travel, visas, and fan zones',
      blocks: [
        {
          type: 'prose',
          text: 'The 2026 World Cup spans approximately 5,000 km from north to south across three countries. Planning travel between venues requires attention to visa requirements, distances, and local transport.',
        },
        {
          type: 'table',
          headers: ['Passport', 'USA', 'Canada', 'Mexico'],
          rows: [
            ['Moroccan', 'Visa required (B1/B2)', 'Visa required (TRV)', 'Visa-free (180 days)'],
            ['EU / Schengen', 'ESTA (visa waiver)', 'eTA', 'Visa-free (180 days)'],
            ['UK', 'ESTA (visa waiver)', 'eTA', 'Visa-free (180 days)'],
            [
              'GCC nationals',
              'Visa required (B1/B2)',
              'Visa required (TRV)',
              'Visa-free (180 days)',
            ],
          ],
        },
        {
          type: 'list',
          items: [
            'Budget travel: hostels and shared accommodation from ~$40\u2013$80/night in smaller host cities; domestic flights from ~$80 one-way booked early',
            'Mid-range: hotels near stadiums from ~$150\u2013$300/night; car rental for multi-city trips',
            'Premium: official FIFA hospitality packages include accommodation, transfers, and match tickets',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'Fan zones with big screens and entertainment will be set up in each host city. These are free to attend and offer a communal match-day experience for fans without stadium tickets.',
        },
      ],
    },

    // 10. about-predictions
    {
      id: 'about-predictions',
      heading: 'Predictions and favorites',
      blocks: [
        {
          type: 'prose',
          text: 'Pre-tournament analysis points to a tight field. The expanded format means more upsets are likely, and historical dominance is less predictive in a 48-team bracket.',
        },
        {
          type: 'table',
          headers: ['Team', 'Strength', 'Key factor'],
          rows: [
            [
              'Spain',
              'Reigning European champions',
              'Generational midfield depth with Yamal, Pedri, Gavi',
            ],
            [
              'France',
              '2-time champions, consistent finalists',
              'Mbappe-led attack, tournament pedigree',
            ],
            [
              'England',
              'Back-to-back Euro finalists',
              'Squad depth across top Premier League clubs',
            ],
            ['Argentina', 'Defending champions', 'Messi farewell tour, Scaloni system maturity'],
            ['Brazil', '5-time champions', 'Talent reload under new coaching direction'],
            ['Germany', 'Home continent advantage', 'Post-Euro 2024 rebuilding momentum'],
            ['Morocco', 'African hope', '2022 semi-final pedigree, Regragui defensive system'],
          ],
        },
        {
          type: 'list',
          items: [
            'Dark horses: Colombia, Nigeria, Japan, USA (host advantage)',
            'Golden Boot candidates: Mbappe, Haaland, Vinicius Jr, En-Nesyri',
          ],
        },
      ],
    },

    // 11. about-legacy
    {
      id: 'about-legacy',
      heading: 'Tournament legacy and 2030 outlook',
      blocks: [
        {
          type: 'prose',
          text: "The 2026 World Cup is expected to generate significant economic impact across all three host nations. FIFA projects over 5 million in-person spectators and billions of viewers worldwide. Revenue from broadcasting, sponsorship, and tourism flows through host cities' local economies.",
        },
        {
          type: 'prose',
          text: "The tri-nation model sets a precedent for future mega-events. Sharing infrastructure costs and logistics across countries makes hosting more accessible, though it introduces complexity around cross-border travel and coordination. The 2030 World Cup will follow a similar multi-nation approach with Spain, Portugal, and Morocco as hosts, with opening matches in Argentina, Uruguay, and Paraguay to mark the tournament's centenary.",
        },
        {
          type: 'prose',
          text: "For Morocco, 2026 serves as both a competitive stage and a rehearsal. The experience of participating as a team, combined with the organizational lessons from observing a tri-nation event, directly informs Morocco's 2030 hosting preparations. Stadium and transport infrastructure projects in Casablanca, Rabat, Marrakech, Tangier, Fez, and Agadir are already underway.",
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'How does the 48-team format work?',
      answer:
        '48 teams are divided into 12 groups of 4. The top 2 from each group plus the 8 best third-placed teams advance to a 32-team knockout bracket, starting with the Round of 32.',
    },
    {
      question: 'When does Morocco play at the 2026 World Cup?',
      answer:
        'Morocco plays Brazil on June 13, Haiti on June 18, and Scotland on June 22. All matches are Group C.',
    },
    {
      question: 'Where can I watch the World Cup in Morocco?',
      answer:
        'Arryadia TV and SNRT broadcast matches free-to-air. beIN Sports MENA carries all matches. FIFA+ streams select games globally for free.',
    },
    {
      question: 'Are tickets still available?',
      answer:
        'Check FIFA.com/tickets for the latest availability. Group-stage tickets start from approximately $60 USD. Only purchase from official channels.',
    },
    {
      question: 'Do I need a visa to attend matches?',
      answer:
        'It depends on your nationality and which host country you visit. Moroccan passport holders need visas for the USA and Canada but can enter Mexico visa-free. EU citizens can use ESTA (USA) and eTA (Canada).',
    },
    {
      question: "Will Morocco's group be tough?",
      answer:
        "Group C includes Brazil (5-time champions), Haiti (debutants), and Scotland (returning after 28 years). Brazil is the clear favorite, but Morocco's 2022 pedigree makes them strong contenders for second place.",
    },
    {
      question: 'What are the tiebreaker rules?',
      answer:
        'Groups are decided by: points, goal difference, goals scored, head-to-head record, fair play points, then drawing of lots. Best third-placed teams are ranked across all 12 groups by the same criteria.',
    },
    {
      question: 'Why are three countries hosting?',
      answer:
        'The USA, Canada, and Mexico submitted a joint bid (United 2026) which was selected by FIFA in 2018. The tri-nation model distributes costs and infrastructure requirements. It sets a precedent followed by the 2030 World Cup (Spain, Portugal, Morocco).',
    },
    {
      question: 'Which stadium hosts the final?',
      answer:
        'MetLife Stadium in East Rutherford, New Jersey, with a capacity of 82,500. It also hosts a semi-final.',
    },
    {
      question: 'Is the tournament accessible for disabled fans?',
      answer:
        'FIFA requires all venues to provide accessible seating, entrances, and facilities. Accessible tickets are available through the standard FIFA ticketing platform at reduced prices. Each host stadium has dedicated accessibility coordinators.',
    },
    {
      question: 'What about family travel?',
      answer:
        'Host cities offer family-friendly fan zones with free entertainment. Many stadiums are near public transit. Booking accommodation and domestic flights early is strongly recommended given the 39-day tournament window.',
    },
    {
      question: 'Could the schedule change last-minute?',
      answer:
        'FIFA reserves the right to adjust match times. Always check FIFA.com for the latest official schedule. Atlas Kings updates fixture times automatically from official data feeds.',
    },
    {
      question: 'What happens after 2026 for Morocco?',
      answer:
        'Morocco co-hosts the 2030 World Cup with Spain and Portugal, becoming the first African nation to host the tournament. Opening matches will be held in Argentina, Uruguay, and Paraguay to celebrate the centenary of the first World Cup.',
    },
  ],
};

// ── FR (legacy shape, migrated in Chunk C) ──

const WC_2026_FR_LEGACY: LegacyAboutContent = {
  sections: [
    {
      heading: 'A propos de la Coupe du Monde FIFA 2026',
      body: "La Coupe du Monde FIFA 2026 est la 23eme edition du tournoi mondial de football masculin. Elle se deroule du 11 juin au 19 juillet 2026 dans 3 pays \u2014 les Etats-Unis, le Canada et le Mexique. C'est la premiere edition a 48 equipes, contre 32 lors des editions precedentes.",
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

// ── AR (legacy shape, migrated in Chunk C) ──

const WC_2026_AR_LEGACY: LegacyAboutContent = {
  sections: [
    {
      heading:
        '\u062d\u0648\u0644 \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 \u0641\u064a\u0641\u0627 2026',
      body: '\u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 \u0641\u064a\u0641\u0627 2026 \u0647\u064a \u0627\u0644\u0646\u0633\u062e\u0629 \u0627\u0644\u064023 \u0645\u0646 \u0628\u0637\u0648\u0644\u0629 \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 \u0644\u0643\u0631\u0629 \u0627\u0644\u0642\u062f\u0645 \u0644\u0644\u0631\u062c\u0627\u0644. \u062a\u0642\u0627\u0645 \u0645\u0646 11 \u064a\u0648\u0646\u064a\u0648 \u0625\u0644\u0649 19 \u064a\u0648\u0644\u064a\u0648 2026 \u0641\u064a 3 \u062f\u0648\u0644 \u2014 \u0627\u0644\u0648\u0644\u0627\u064a\u0627\u062a \u0627\u0644\u0645\u062a\u062d\u062f\u0629 \u0648\u0643\u0646\u062f\u0627 \u0648\u0627\u0644\u0645\u0643\u0633\u064a\u0643. \u0647\u0630\u0647 \u0623\u0648\u0644 \u0646\u0633\u062e\u0629 \u0628\u0645\u0634\u0627\u0631\u0643\u0629 48 \u0645\u0646\u062a\u062e\u0628\u0627\u064b \u0628\u062f\u0644\u0627\u064b \u0645\u0646 32 \u0641\u064a \u0627\u0644\u0646\u0633\u062e \u0627\u0644\u0633\u0627\u0628\u0642\u0629.',
    },
    {
      heading: '\u0646\u0638\u0627\u0645 \u0627\u0644\u0628\u0637\u0648\u0644\u0629',
      body: '48 \u0645\u0646\u062a\u062e\u0628\u0627\u064b \u0648\u0637\u0646\u064a\u0627\u064b \u0645\u0648\u0632\u0639\u064a\u0646 \u0639\u0644\u0649 12 \u0645\u062c\u0645\u0648\u0639\u0629 \u0645\u0646 4 \u0641\u0631\u0642. \u064a\u0644\u0639\u0628 \u0643\u0644 \u0645\u0646\u062a\u062e\u0628 3 \u0645\u0628\u0627\u0631\u064a\u0627\u062a \u0641\u064a \u0645\u0631\u062d\u0644\u0629 \u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0627\u062a. \u064a\u062a\u0623\u0647\u0644 \u0623\u0648\u0644 \u0641\u0631\u064a\u0642\u064a\u0646 \u0645\u0646 \u0643\u0644 \u0645\u062c\u0645\u0648\u0639\u0629 (24 \u0645\u0646\u062a\u062e\u0628\u0627\u064b) \u0628\u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0623\u0641\u0636\u0644 8 \u0641\u0631\u0642 \u0645\u0646 \u0623\u0635\u062d\u0627\u0628 \u0627\u0644\u0645\u0631\u0643\u0632 \u0627\u0644\u062b\u0627\u0644\u062b (\u0645\u0646 12 \u0645\u062c\u0645\u0648\u0639\u0629) \u0625\u0644\u0649 \u0645\u0631\u062d\u0644\u0629 \u0627\u0644\u0625\u0642\u0635\u0627\u0621 \u0628\u062f\u0621\u0627\u064b \u0645\u0646 \u062f\u0648\u0631 \u0627\u0644\u064032. 104 \u0645\u0628\u0627\u0631\u064a\u0627\u062a \u0625\u062c\u0645\u0627\u0644\u0627\u064b.',
    },
    {
      heading:
        '\u0627\u0644\u0645\u063a\u0631\u0628 \u0641\u064a \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026',
      body: '\u064a\u0634\u0627\u0631\u0643 \u0627\u0644\u0645\u063a\u0631\u0628 \u0641\u064a \u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0629 C \u0625\u0644\u0649 \u062c\u0627\u0646\u0628 \u0627\u0644\u0628\u0631\u0627\u0632\u064a\u0644 \u0648\u0647\u0627\u064a\u062a\u064a \u0648\u0627\u0633\u0643\u062a\u0644\u0646\u062f\u0627. \u0628\u0639\u062f \u0625\u0646\u062c\u0627\u0632 \u062a\u0627\u0631\u064a\u062e\u064a \u0628\u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0646\u0635\u0641 \u0627\u0644\u0646\u0647\u0627\u0626\u064a \u0641\u064a \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2022 \u0641\u064a \u0642\u0637\u0631 (\u0627\u0644\u0645\u0631\u0643\u0632 \u0627\u0644\u0631\u0627\u0628\u0639)\u060c \u064a\u0639\u0648\u062f \u0623\u0633\u0648\u062f \u0627\u0644\u0623\u0637\u0644\u0633 \u0625\u0644\u0649 \u0627\u0644\u0645\u0633\u0631\u062d \u0627\u0644\u0639\u0627\u0644\u0645\u064a \u0637\u0627\u0645\u062d\u064a\u0646 \u0644\u062a\u062d\u0642\u064a\u0642 \u0625\u0646\u062c\u0627\u0632 \u0643\u0628\u064a\u0631 \u062c\u062f\u064a\u062f. \u0633\u064a\u0633\u062a\u0636\u064a\u0641 \u0627\u0644\u0645\u063a\u0631\u0628 \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2030 \u0645\u0639 \u0625\u0633\u0628\u0627\u0646\u064a\u0627 \u0648\u0627\u0644\u0628\u0631\u062a\u063a\u0627\u0644.',
    },
    {
      heading:
        '\u0627\u0644\u0645\u0644\u0627\u0639\u0628 \u0648\u0627\u0644\u0645\u062f\u0646 \u0627\u0644\u0645\u0633\u062a\u0636\u064a\u0641\u0629',
      body: '16 \u0645\u062f\u064a\u0646\u0629 \u0645\u0633\u062a\u0636\u064a\u0641\u0629 \u0625\u062c\u0645\u0627\u0644\u0627\u064b: 11 \u0641\u064a \u0627\u0644\u0648\u0644\u0627\u064a\u0627\u062a \u0627\u0644\u0645\u062a\u062d\u062f\u0629 (\u0645\u0646 \u0628\u064a\u0646\u0647\u0627 \u0646\u064a\u0648\u064a\u0648\u0631\u0643 \u0648\u0644\u0648\u0633 \u0623\u0646\u062c\u0644\u0648\u0633 \u0648\u062f\u0627\u0644\u0627\u0633 \u0648\u0628\u0648\u0633\u0637\u0646 \u0648\u0647\u064a\u0648\u0633\u062a\u0646 \u0648\u0645\u064a\u0627\u0645\u064a \u0648\u0641\u064a\u0644\u0627\u062f\u0644\u0641\u064a\u0627 \u0648\u0633\u064a\u0627\u062a\u0644 \u0648\u0623\u062a\u0644\u0627\u0646\u062a\u0627 \u0648\u0633\u0627\u0646 \u0641\u0631\u0627\u0646\u0633\u064a\u0633\u0643\u0648 \u0648\u0643\u0627\u0646\u0633\u0627\u0633 \u0633\u064a\u062a\u064a)\u060c 3 \u0641\u064a \u0627\u0644\u0645\u0643\u0633\u064a\u0643 (\u0645\u0643\u0633\u064a\u0643\u0648 \u0633\u064a\u062a\u064a \u0648\u063a\u0648\u0627\u062f\u0627\u0644\u0627\u062e\u0627\u0631\u0627 \u0648\u0645\u0648\u0646\u062a\u064a\u0631\u064a)\u060c \u06482 \u0641\u064a \u0643\u0646\u062f\u0627 (\u062a\u0648\u0631\u0646\u062a\u0648 \u0648\u0641\u0627\u0646\u0643\u0648\u0641\u0631). \u0633\u062a\u0642\u0627\u0645 \u0627\u0644\u0645\u0628\u0627\u0631\u0627\u0629 \u0627\u0644\u0646\u0647\u0627\u0626\u064a\u0629 \u0641\u064a \u0645\u0644\u0639\u0628 \u0645\u064a\u062a\u0644\u0627\u064a\u0641 \u0641\u064a \u0646\u064a\u0648\u062c\u064a\u0631\u0633\u064a.',
    },
    {
      heading:
        '\u0627\u0644\u0641\u0627\u0626\u0632\u0648\u0646 \u0627\u0644\u0633\u0627\u0628\u0642\u0648\u0646',
      body: '\u0627\u0644\u0623\u0631\u062c\u0646\u062a\u064a\u0646 \u0647\u064a \u062d\u0627\u0645\u0644\u0629 \u0627\u0644\u0644\u0642\u0628 (2022) \u0628\u06403 \u0623\u0644\u0642\u0627\u0628 \u0625\u062c\u0645\u0627\u0644\u0627\u064b. \u0627\u0644\u0628\u0631\u0627\u0632\u064a\u0644 \u062a\u062d\u0645\u0644 \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0642\u064a\u0627\u0633\u064a \u0628\u06405 \u0623\u0644\u0642\u0627\u0628. \u062a\u0644\u064a\u0647\u0627 \u0623\u0644\u0645\u0627\u0646\u064a\u0627 \u0648\u0625\u064a\u0637\u0627\u0644\u064a\u0627 \u0628\u06404 \u0623\u0644\u0642\u0627\u0628 \u0644\u0643\u0644 \u0645\u0646\u0647\u0645\u0627. \u0641\u0631\u0646\u0633\u0627 \u0628\u0644\u0642\u0628\u064a\u0646. \u0644\u0645 \u064a\u0641\u0632 \u0623\u064a \u0645\u0646\u062a\u062e\u0628 \u0625\u0641\u0631\u064a\u0642\u064a \u0628\u0627\u0644\u0628\u0637\u0648\u0644\u0629\u061b \u0627\u0644\u0645\u063a\u0631\u0628 \u0648\u0635\u0644 \u0625\u0644\u0649 \u0646\u0635\u0641 \u0627\u0644\u0646\u0647\u0627\u0626\u064a \u0641\u064a 2022 (\u0623\u0641\u0636\u0644 \u0646\u062a\u064a\u062c\u0629 \u0625\u0641\u0631\u064a\u0642\u064a\u0629 \u0625\u0644\u0649 \u062c\u0627\u0646\u0628 \u063a\u0627\u0646\u0627 \u0641\u064a 2010).',
    },
    {
      heading:
        '\u0623\u0637\u0644\u0633 \u0643\u064a\u0646\u063a\u0632 \u0648\u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026',
      body: '\u064a\u063a\u0637\u064a \u0623\u0637\u0644\u0633 \u0643\u064a\u0646\u063a\u0632 \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026 \u0645\u0639 \u062a\u0631\u0643\u064a\u0632 \u062e\u0627\u0635 \u0639\u0644\u0649 \u0645\u0633\u064a\u0631\u0629 \u0623\u0633\u0648\u062f \u0627\u0644\u0623\u0637\u0644\u0633\u060c \u0648\u0627\u0644\u0644\u0627\u0639\u0628\u064a\u0646 \u0627\u0644\u0645\u063a\u0627\u0631\u0628\u0629 \u0627\u0644\u0645\u062d\u062a\u0631\u0641\u064a\u0646 \u0641\u064a \u0627\u0644\u062e\u0627\u0631\u062c \u0627\u0644\u0630\u064a\u0646 \u064a\u0645\u062b\u0644\u0648\u0646 \u0645\u0646\u062a\u062e\u0628\u0647\u0645\u060c \u0648\u0642\u0635\u0635 \u0627\u0644\u0644\u0627\u0639\u0628\u064a\u0646 \u0648\u0627\u0644\u0645\u062f\u0631\u0628\u064a\u0646 \u0645\u0646 \u0627\u0644\u0642\u0627\u0631\u0629 \u0627\u0644\u0625\u0641\u0631\u064a\u0642\u064a\u0629.',
    },
  ],
  faqs: [
    {
      question:
        '\u0645\u062a\u0649 \u062a\u0628\u062f\u0623 \u0648\u062a\u0646\u062a\u0647\u064a \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026\u061f',
      answer:
        '\u0645\u0646 11 \u064a\u0648\u0646\u064a\u0648 \u0625\u0644\u0649 19 \u064a\u0648\u0644\u064a\u0648 2026.',
    },
    {
      question:
        '\u0641\u064a \u0623\u064a \u0645\u062c\u0645\u0648\u0639\u0629 \u064a\u0644\u0639\u0628 \u0627\u0644\u0645\u063a\u0631\u0628 \u0641\u064a \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026\u061f',
      answer:
        '\u0627\u0644\u0645\u063a\u0631\u0628 \u0641\u064a \u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0629 C \u0645\u0639 \u0627\u0644\u0628\u0631\u0627\u0632\u064a\u0644 \u0648\u0647\u0627\u064a\u062a\u064a \u0648\u0627\u0633\u0643\u062a\u0644\u0646\u062f\u0627.',
    },
    {
      question:
        '\u0643\u0645 \u0639\u062f\u062f \u0627\u0644\u0645\u0646\u062a\u062e\u0628\u0627\u062a \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629 \u0641\u064a \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026\u061f',
      answer:
        '48 \u0645\u0646\u062a\u062e\u0628\u0627\u064b \u0648\u0637\u0646\u064a\u0627\u064b\u060c \u0623\u064a 16 \u0623\u0643\u062b\u0631 \u0645\u0646 \u0646\u0633\u062e\u0629 2022. \u0647\u0630\u0647 \u0623\u0648\u0644 \u0646\u0633\u062e\u0629 \u0628\u0627\u0644\u0635\u064a\u063a\u0629 \u0627\u0644\u0645\u0648\u0633\u0639\u0629.',
    },
    {
      question:
        '\u0623\u064a\u0646 \u064a\u0645\u0643\u0646 \u0645\u0634\u0627\u0647\u062f\u0629 \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026 \u0641\u064a \u0627\u0644\u0645\u063a\u0631\u0628\u061f',
      answer:
        '\u062a\u064f\u0628\u062b \u0627\u0644\u0645\u0628\u0627\u0631\u064a\u0627\u062a \u0639\u0644\u0649 \u0642\u0646\u0627\u0629 \u0627\u0644\u0631\u064a\u0627\u0636\u064a\u0629 \u0648\u0642\u0646\u0648\u0627\u062a SNRT (\u0627\u0644\u0642\u0646\u0648\u0627\u062a \u0627\u0644\u0639\u0645\u0648\u0645\u064a\u0629 \u0627\u0644\u0645\u063a\u0631\u0628\u064a\u0629).',
    },
    {
      question:
        '\u0623\u064a\u0646 \u062a\u064f\u0642\u0627\u0645 \u0646\u0647\u0627\u0626\u064a \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026\u061f',
      answer:
        '\u0641\u064a \u0645\u0644\u0639\u0628 \u0645\u064a\u062a\u0644\u0627\u064a\u0641 \u0641\u064a \u0625\u064a\u0633\u062a \u0631\u0630\u0631\u0641\u0648\u0631\u062f\u060c \u0646\u064a\u0648\u062c\u064a\u0631\u0633\u064a\u060c \u0627\u0644\u0648\u0644\u0627\u064a\u0627\u062a \u0627\u0644\u0645\u062a\u062d\u062f\u0629.',
    },
    {
      question:
        '\u0645\u0646 \u0647\u0645 \u0627\u0644\u0644\u0627\u0639\u0628\u0648\u0646 \u0627\u0644\u0645\u063a\u0627\u0631\u0628\u0629 \u0627\u0644\u0645\u062d\u062a\u0631\u0641\u0648\u0646 \u0627\u0644\u0630\u064a\u0646 \u064a\u0645\u062b\u0644\u0648\u0646 \u0627\u0644\u0645\u063a\u0631\u0628\u061f',
      answer:
        '\u0623\u0634\u0631\u0641 \u062d\u0643\u064a\u0645\u064a (\u0628\u0627\u0631\u064a\u0633 \u0633\u0627\u0646 \u062c\u064a\u0631\u0645\u0627\u0646)\u060c \u0625\u0628\u0631\u0627\u0647\u064a\u0645 \u062f\u064a\u0627\u0632 (\u0628\u0627\u064a\u0631\u0646)\u060c \u0646\u0635\u064a\u0631 \u0645\u0632\u0631\u0627\u0648\u064a (\u0645\u0627\u0646\u0634\u0633\u062a\u0631 \u064a\u0648\u0646\u0627\u064a\u062a\u062f)\u060c \u064a\u0648\u0633\u0641 \u0627\u0644\u0646\u0635\u064a\u0631\u064a (\u0641\u0646\u0631\u0628\u062e\u0634\u0629)\u060c \u0633\u0641\u064a\u0627\u0646 \u0623\u0645\u0631\u0627\u0628\u0637 (\u0631\u064a\u0627\u0644 \u0628\u064a\u062a\u064a\u0633)\u060c \u0646\u0627\u064a\u0641 \u0623\u0643\u0631\u062f (\u0631\u064a\u0627\u0644 \u0633\u0648\u0633\u064a\u062f\u0627\u062f)\u060c \u0648\u063a\u064a\u0631\u0647\u0645.',
    },
    {
      question:
        '\u0643\u064a\u0641 \u064a\u0639\u0645\u0644 \u0646\u0638\u0627\u0645 \u0627\u0644\u062a\u0623\u0647\u0644 \u0625\u0644\u0649 \u062f\u0648\u0631 \u0627\u0644\u064032\u061f',
      answer:
        '\u0623\u0648\u0644 \u0641\u0631\u064a\u0642\u064a\u0646 \u0645\u0646 \u0643\u0644 \u0645\u062c\u0645\u0648\u0639\u0629 + \u0623\u0641\u0636\u0644 8 \u0641\u0631\u0642 \u062b\u0627\u0644\u062b\u0629 (\u0645\u0646 12 \u0645\u062c\u0645\u0648\u0639\u0629) = 32 \u0645\u0646\u062a\u062e\u0628\u0627\u064b \u0641\u064a \u062f\u0648\u0631 \u0627\u0644\u064032.',
    },
    {
      question:
        '\u0647\u0644 \u0633\u064a\u0633\u062a\u0636\u064a\u0641 \u0627\u0644\u0645\u063a\u0631\u0628 \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645\u061f',
      answer:
        '\u0633\u064a\u0633\u062a\u0636\u064a\u0641 \u0627\u0644\u0645\u063a\u0631\u0628 \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2030 \u0645\u0639 \u0625\u0633\u0628\u0627\u0646\u064a\u0627 \u0648\u0627\u0644\u0628\u0631\u062a\u063a\u0627\u0644\u060c \u0644\u064a\u0635\u0628\u062d \u0623\u0648\u0644 \u0628\u0644\u062f \u0625\u0641\u0631\u064a\u0642\u064a \u064a\u0633\u062a\u0636\u064a\u0641 \u0627\u0644\u0628\u0637\u0648\u0644\u0629.',
    },
  ],
};

// ── Registry ──

// New shape for EN, legacy for FR/AR until Chunk C
const ABOUT_CONTENT_REGISTRY: Record<number, Record<Locale, AboutContent>> = {
  1: {
    en: WC_2026_EN,
    // FR and AR: convert legacy to new shape at runtime
    fr: legacyToNew(WC_2026_FR_LEGACY),
    ar: legacyToNew(WC_2026_AR_LEGACY),
  },
};

/** Convert legacy 6-section content to the new card-based shape */
function legacyToNew(legacy: LegacyAboutContent): AboutContent {
  return {
    cards: legacy.sections.map((section, i) => ({
      id: `about-section-${i}`,
      heading: section.heading,
      blocks: [{ type: 'prose' as const, text: section.body }],
    })),
    faqs: legacy.faqs,
  };
}

export function getAboutContent(competitionId: number, locale: Locale): AboutContent | undefined {
  return ABOUT_CONTENT_REGISTRY[competitionId]?.[locale];
}
