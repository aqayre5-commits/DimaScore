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

// ── FR ──

const WC_2026_FR: AboutContent = {
  cards: [
    {
      id: 'quick-facts',
      heading: null,
      blocks: [
        { type: 'stat-card', label: '\u00c9quipes', value: '48' },
        { type: 'stat-card', label: 'Groupes', value: '12' },
        { type: 'stat-card', label: 'Matchs', value: '104' },
        { type: 'stat-card', label: 'Stades', value: '16' },
        { type: 'stat-card', label: 'Dates', value: '11 juin \u2013 19 juil.' },
        { type: 'stat-card', label: 'Dur\u00e9e', value: '39 jours' },
      ],
    },
    {
      id: 'about-format',
      heading: 'Le format \u00e0 48 \u00e9quipes',
      blocks: [
        {
          type: 'prose',
          text: 'La Coupe du Monde 2026 est la premi\u00e8re \u00e0 48 \u00e9quipes, contre 32 pr\u00e9c\u00e9demment. Les \u00e9quipes sont r\u00e9parties en 12 groupes de 4. Chaque \u00e9quipe dispute 3 matchs de phase de groupes. Les 2 premiers de chaque groupe (24 \u00e9quipes) plus les 8 meilleurs troisi\u00e8mes acc\u00e8dent \u00e0 un tableau \u00e0 \u00e9limination directe de 32 \u00e9quipes.',
        },
        {
          type: 'prose',
          text: "La phase \u00e0 \u00e9limination directe d\u00e9bute aux 1/16e de finale, suivis des 1/8e, quarts de finale, demi-finales, match pour la 3e place et finale. Prolongations et tirs au but s'appliquent \u00e0 tous les matchs \u00e0 \u00e9limination directe.",
        },
        {
          type: 'table',
          headers: ['Priorit\u00e9', 'Crit\u00e8re de d\u00e9partage'],
          rows: [
            ['1', 'Points (3 pour une victoire, 1 pour un nul)'],
            ['2', 'Diff\u00e9rence de buts'],
            ['3', 'Buts marqu\u00e9s'],
            ['4', 'Points en confrontation directe'],
            ['5', 'Diff\u00e9rence de buts en confrontation directe'],
            ['6', 'Buts marqu\u00e9s en confrontation directe'],
            ['7', 'Points fair-play (cartons jaunes/rouges)'],
            ['8', 'Tirage au sort par la FIFA'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'Par rapport \u00e0 2022 : 16 \u00e9quipes suppl\u00e9mentaires, 40 matchs de plus, les nouveaux 1/16e de finale, et un syst\u00e8me de qualification des meilleurs troisi\u00e8mes qui r\u00e9compense les performances comp\u00e9titives.',
        },
      ],
    },
    {
      id: 'about-venues',
      heading: 'Villes h\u00f4tes et stades',
      blocks: [
        {
          type: 'prose',
          text: 'Les matchs se d\u00e9roulent dans 16 stades r\u00e9partis entre 3 pays. Les \u00c9tats-Unis accueillent la majorit\u00e9 avec 11 sites, le Mexique en offre 3 et le Canada 2. La finale se joue au MetLife Stadium dans le New Jersey.',
        },
        {
          type: 'table',
          headers: ['Ville', 'Pays', 'Stade', 'Capacit\u00e9'],
          rows: [
            ['New York/NJ', '\u00c9tats-Unis', 'MetLife Stadium', '82 500'],
            ['Los Angeles', '\u00c9tats-Unis', 'SoFi Stadium', '70 240'],
            ['Dallas', '\u00c9tats-Unis', 'AT&T Stadium', '80 000'],
            ['Boston/Foxborough', '\u00c9tats-Unis', 'Gillette Stadium', '65 878'],
            ['Houston', '\u00c9tats-Unis', 'NRG Stadium', '72 220'],
            ['Miami', '\u00c9tats-Unis', 'Hard Rock Stadium', '64 767'],
            ['Philadelphie', '\u00c9tats-Unis', 'Lincoln Financial Field', '69 176'],
            ['Seattle', '\u00c9tats-Unis', 'Lumen Field', '68 740'],
            ['Atlanta', '\u00c9tats-Unis', 'Mercedes-Benz Stadium', '71 000'],
            ['San Francisco', '\u00c9tats-Unis', "Levi's Stadium", '68 500'],
            ['Kansas City', '\u00c9tats-Unis', 'Arrowhead Stadium', '76 416'],
            ['Mexico', 'Mexique', 'Estadio Azteca', '87 523'],
            ['Guadalajara', 'Mexique', 'Estadio Akron', '49 850'],
            ['Monterrey', 'Mexique', 'Estadio BBVA', '53 500'],
            ['Toronto', 'Canada', 'BMO Field', '45 736'],
            ['Vancouver', 'Canada', 'BC Place', '54 500'],
          ],
        },
      ],
    },
    {
      id: 'about-morocco',
      heading: 'Le Maroc \u00e0 la Coupe du Monde',
      blocks: [
        {
          type: 'prose',
          text: "Le Maroc participe dans le Groupe C aux c\u00f4t\u00e9s du Br\u00e9sil, d'Ha\u00efti et de l'\u00c9cosse. Les Lions de l'Atlas portent l'\u00e9lan de leur campagne historique de 2022 au Qatar, o\u00f9 ils sont devenus la premi\u00e8re \u00e9quipe africaine et arabe \u00e0 atteindre une demi-finale de Coupe du Monde, terminant 4es.",
        },
        {
          type: 'prose',
          text: "L'\u00e9quipe actuelle m\u00eale exp\u00e9rience et jeunesse. Achraf Hakimi, Noussair Mazraoui et Sofyan Amrabat forment la colonne vert\u00e9brale, tandis qu'une nouvelle g\u00e9n\u00e9ration pousse aux portes de la s\u00e9lection. Le syst\u00e8me de contre-attaque et la d\u00e9fense organis\u00e9e du s\u00e9lectionneur Walid Regragui restent la marque de fabrique de l'\u00e9quipe.",
        },
        {
          type: 'prose',
          text: "Au-del\u00e0 de 2026, le Maroc co-organisera la Coupe du Monde 2030 avec l'Espagne et le Portugal, devenant le premier pays africain \u00e0 accueillir le tournoi. La diaspora marocaine en Europe et en Am\u00e9rique du Nord devrait transformer les stades du Groupe C en v\u00e9ritables ambiances \u00e0 domicile.",
        },
        {
          type: 'timeline',
          events: [
            {
              date: '13 juin 2026',
              label: 'Br\u00e9sil \u2013 Maroc',
              detail: 'Groupe C, Journ\u00e9e 1',
            },
            {
              date: '18 juin 2026',
              label: 'Maroc \u2013 Ha\u00efti',
              detail: 'Groupe C, Journ\u00e9e 2',
            },
            {
              date: '22 juin 2026',
              label: '\u00c9cosse \u2013 Maroc',
              detail: 'Groupe C, Journ\u00e9e 3',
            },
          ],
        },
      ],
    },
    {
      id: 'about-teams',
      heading: '\u00c9quipes qualifi\u00e9es',
      blocks: [
        {
          type: 'prose',
          text: "Le format \u00e9largi \u00e0 48 \u00e9quipes offre une repr\u00e9sentation mondiale sans pr\u00e9c\u00e9dent. L'Afrique et l'Asie ont re\u00e7u des places suppl\u00e9mentaires, et plusieurs nations se qualifient pour la premi\u00e8re fois de leur histoire.",
        },
        {
          type: 'list',
          items: [
            'D\u00e9butants : Indon\u00e9sie, Cap-Vert, Cura\u00e7ao, Tanzanie',
            'Retours attendus : \u00c9cosse (28 ans), Irak (40+ ans)',
            'Afrique : 9 \u00e9quipes (contre 5 en 2022)',
            'Asie : 8 \u00e9quipes (contre 6 en 2022)',
            'Europe : 16 \u00e9quipes',
            'Am\u00e9rique du Sud : 6 \u00e9quipes',
            'Am\u00e9rique du Nord, centrale et Cara\u00efbes : 6 \u00e9quipes (dont 3 h\u00f4tes)',
            'Oc\u00e9anie : 1 \u00e9quipe (Nouvelle-Z\u00e9lande)',
          ],
        },
      ],
    },
    {
      id: 'about-storylines',
      heading: 'R\u00e9cits \u00e0 suivre',
      blocks: [
        {
          type: 'prose',
          text: "La Coupe du Monde 2026 arrive \u00e0 un moment charnière du football. Le format \u00e9largi promet une participation mondiale plus large mais soul\u00e8ve des questions sur l'\u00e9quilibre comp\u00e9titif \u00e0 travers 104 matchs.",
        },
        {
          type: 'list',
          items: [
            'Probable derni\u00e8re Coupe du Monde pour Messi et Ronaldo, cl\u00f4turant une \u00e8re qui a d\u00e9fini le sport pendant deux d\u00e9cennies',
            "La qu\u00eate de l'Argentine pour d\u00e9fendre son titre de 2022, visant deux sacres cons\u00e9cutifs",
            'La premi\u00e8re Coupe du Monde co-organis\u00e9e par trois nations, sur 5 000 km de Vancouver \u00e0 Mexico',
            "L'\u00e9lan du Maroc : les demi-finalistes de 2022 peuvent-ils aller plus loin dans un groupe avec le Br\u00e9sil ?",
            'Des nations d\u00e9butantes face aux puissances \u00e9tablies pour la premi\u00e8re fois sur la sc\u00e8ne mondiale',
          ],
        },
      ],
    },
    {
      id: 'about-tickets',
      heading: 'Billets et hospitalit\u00e9',
      blocks: [
        {
          type: 'prose',
          text: "La FIFA g\u00e8re toutes les ventes de billets via sa plateforme officielle. Les prix varient selon la cat\u00e9gorie du match, l'emplacement dans le stade et le stade du tournoi.",
        },
        {
          type: 'list',
          items: [
            'Cat\u00e9gorie 4 (phase de groupes) : \u00e0 partir de ~60 $ USD',
            'Cat\u00e9gorie 1 (phase de groupes) : \u00e0 partir de ~300 $ USD',
            'Phase \u00e0 \u00e9limination directe : de ~150 \u00e0 600+ $ USD selon le tour',
            'Finale : de ~600 \u00e0 1 800+ $ USD',
            'Packages hospitalit\u00e9 via On Location (partenaire officiel FIFA) : si\u00e8ges premium, salons et forfaits voyage',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Achetez vos billets uniquement sur FIFA.com/tickets ou aupr\u00e8s de revendeurs agr\u00e9\u00e9s. Les plateformes tierces pr\u00e9sentent des risques de billets contrefaits et de prix gonfl\u00e9s. La FIFA a annul\u00e9 des billets obtenus par des canaux non autoris\u00e9s lors des tournois pr\u00e9c\u00e9dents.',
        },
      ],
    },
    {
      id: 'about-watch',
      heading: 'En direct \u00e0 la TV et en streaming',
      blocks: [
        {
          type: 'prose',
          text: 'La Coupe du Monde 2026 sera diffus\u00e9e dans le monde entier. FIFA+ propose le streaming gratuit de certains matchs. Les diffuseurs r\u00e9gionaux d\u00e9tiennent les droits exclusifs par territoire.',
        },
        {
          type: 'table',
          headers: ['R\u00e9gion', 'Diffuseur(s)'],
          rows: [
            ['Maroc', 'Arryadia TV, SNRT (gratuit), beIN Sports MENA'],
            ['France', 'TF1, beIN Sports'],
            ['\u00c9tats-Unis / Canada', 'FOX, Telemundo, TSN / RDS'],
            ['Royaume-Uni', 'BBC, ITV'],
            ['MENA', 'beIN Sports'],
            ['Afrique subsaharienne', 'SuperSport, Canal+'],
            ['Am\u00e9rique latine', 'Televisa, DIRECTV Sports'],
            ['Asie', 'Sony Sports (Inde), divers selon pays'],
            ['Mondial (gratuit)', 'FIFA+ (matchs s\u00e9lectionn\u00e9s)'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: "Conseil diaspora marocaine : beIN Sports MENA et Arryadia sont disponibles par satellite et IPTV en Europe et en Am\u00e9rique du Nord. V\u00e9rifiez la disponibilit\u00e9 aupr\u00e8s de vos fournisseurs locaux. Tous les matchs se jouent entre 12h00 et 21h00 heure de l'Est (ET).",
        },
      ],
    },
    {
      id: 'about-travel',
      heading: 'Voyager, visas et fan zones',
      blocks: [
        {
          type: 'prose',
          text: "La Coupe du Monde 2026 s'\u00e9tend sur environ 5 000 km du nord au sud \u00e0 travers trois pays. Planifier ses d\u00e9placements entre les sites n\u00e9cessite de prendre en compte les exigences de visa, les distances et les transports locaux.",
        },
        {
          type: 'table',
          headers: ['Passeport', '\u00c9tats-Unis', 'Canada', 'Mexique'],
          rows: [
            ['Marocain', 'Visa requis (B1/B2)', 'Visa requis (TRV)', 'Exempt\u00e9 (180 jours)'],
            ['UE / Schengen', 'ESTA (exemption)', 'AVE', 'Exempt\u00e9 (180 jours)'],
            ['Royaume-Uni', 'ESTA (exemption)', 'AVE', 'Exempt\u00e9 (180 jours)'],
            [
              'Ressortissants CCG',
              'Visa requis (B1/B2)',
              'Visa requis (TRV)',
              'Exempt\u00e9 (180 jours)',
            ],
          ],
        },
        {
          type: 'list',
          items: [
            "Budget : auberges et h\u00e9bergements partag\u00e9s \u00e0 partir de ~40\u201380 $/nuit dans les villes h\u00f4tes secondaires ; vols int\u00e9rieurs d\u00e8s ~80 $ l'aller r\u00e9serv\u00e9 t\u00f4t",
            'Milieu de gamme : h\u00f4tels pr\u00e8s des stades de ~150\u2013300 $/nuit ; location de voiture pour les circuits multi-villes',
            'Premium : packages hospitalit\u00e9 FIFA officiels incluant h\u00e9bergement, transferts et billets',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: "Des fan zones avec \u00e9crans g\u00e9ants et animations seront install\u00e9es dans chaque ville h\u00f4te. L'acc\u00e8s est gratuit et offre une exp\u00e9rience conviviale les jours de match pour les fans sans billet de stade.",
        },
      ],
    },
    {
      id: 'about-predictions',
      heading: 'Pronostics et favoris',
      blocks: [
        {
          type: 'prose',
          text: 'Les analyses pr\u00e9-tournoi d\u00e9signent un plateau tr\u00e8s serr\u00e9. Le format \u00e9largi rend les surprises plus probables, et la domination historique est moins pr\u00e9dictive dans un tableau \u00e0 48 \u00e9quipes.',
        },
        {
          type: 'table',
          headers: ['\u00c9quipe', 'Atout', 'Facteur cl\u00e9'],
          rows: [
            [
              'Espagne',
              'Champions d\u2019Europe en titre',
              'Profondeur g\u00e9n\u00e9rationnelle au milieu avec Yamal, Pedri, Gavi',
            ],
            [
              'France',
              'Double championne, finaliste r\u00e9guli\u00e8re',
              'Attaque men\u00e9e par Mbapp\u00e9, exp\u00e9rience des tournois',
            ],
            [
              'Angleterre',
              'Double finaliste de l\u2019Euro',
              'Profondeur d\u2019effectif dans les meilleurs clubs de Premier League',
            ],
            [
              'Argentine',
              'Tenante du titre',
              'Tourn\u00e9e d\u2019adieu de Messi, maturit\u00e9 du syst\u00e8me Scaloni',
            ],
            [
              'Br\u00e9sil',
              '5 fois champion',
              'Renouvellement des talents sous nouvelle direction',
            ],
            [
              'Allemagne',
              'Avantage continental',
              '\u00c9lan de reconstruction apr\u00e8s l\u2019Euro 2024',
            ],
            [
              'Maroc',
              'Espoir africain',
              'P\u00e9digr\u00e9e de la demi-finale 2022, syst\u00e8me d\u00e9fensif de Regragui',
            ],
          ],
        },
        {
          type: 'list',
          items: [
            'Outsiders : Colombie, Nigeria, Japon, \u00c9tats-Unis (avantage du pays h\u00f4te)',
            'Candidats au Soulier d\u2019or : Mbapp\u00e9, Haaland, Vinicius Jr, En-Nesyri',
          ],
        },
      ],
    },
    {
      id: 'about-legacy',
      heading: 'H\u00e9ritage du tournoi et perspectives 2030',
      blocks: [
        {
          type: 'prose',
          text: 'La Coupe du Monde 2026 devrait g\u00e9n\u00e9rer un impact \u00e9conomique significatif dans les trois pays h\u00f4tes. La FIFA pr\u00e9voit plus de 5 millions de spectateurs en tribunes et des milliards de t\u00e9l\u00e9spectateurs dans le monde. Les revenus li\u00e9s aux droits TV, au sponsoring et au tourisme irrigueront les \u00e9conomies locales des villes h\u00f4tes.',
        },
        {
          type: 'prose',
          text: "Le mod\u00e8le tri-national cr\u00e9e un pr\u00e9c\u00e9dent pour les futurs m\u00e9ga-\u00e9v\u00e9nements. Partager les co\u00fbts d'infrastructure et la logistique entre pays rend l'organisation plus accessible, bien que cela introduise une complexit\u00e9 li\u00e9e aux d\u00e9placements transfrontaliers. La Coupe du Monde 2030 suivra une approche similaire avec l'Espagne, le Portugal et le Maroc comme h\u00f4tes, avec des matchs d'ouverture en Argentine, en Uruguay et au Paraguay pour marquer le centenaire du tournoi.",
        },
        {
          type: 'prose',
          text: "Pour le Maroc, 2026 est \u00e0 la fois une sc\u00e8ne comp\u00e9titive et une r\u00e9p\u00e9tition g\u00e9n\u00e9rale. L'exp\u00e9rience de participer en tant qu'\u00e9quipe, combin\u00e9e aux le\u00e7ons organisationnelles tir\u00e9es de l'observation d'un \u00e9v\u00e9nement tri-national, alimente directement les pr\u00e9paratifs du Maroc pour 2030. Les projets d'infrastructure \u00e0 Casablanca, Rabat, Marrakech, Tanger, F\u00e8s et Agadir sont d\u00e9j\u00e0 en cours.",
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'Comment fonctionne le format \u00e0 48 \u00e9quipes ?',
      answer:
        '48 \u00e9quipes sont r\u00e9parties en 12 groupes de 4. Les 2 premiers de chaque groupe plus les 8 meilleurs troisi\u00e8mes acc\u00e8dent \u00e0 un tableau \u00e0 \u00e9limination directe de 32 \u00e9quipes, \u00e0 partir des 1/16e de finale.',
    },
    {
      question: 'Quand joue le Maroc \u00e0 la Coupe du Monde 2026 ?',
      answer:
        'Le Maroc affronte le Br\u00e9sil le 13 juin, Ha\u00efti le 18 juin et l\u2019\u00c9cosse le 22 juin. Tous les matchs sont dans le Groupe C.',
    },
    {
      question: 'O\u00f9 regarder la Coupe du Monde au Maroc ?',
      answer:
        'Arryadia TV et SNRT diffusent les matchs en clair. beIN Sports MENA couvre tous les matchs. FIFA+ propose le streaming gratuit de certains matchs.',
    },
    {
      question: 'Des billets sont-ils encore disponibles ?',
      answer:
        'Consultez FIFA.com/tickets pour les derni\u00e8res disponibilit\u00e9s. Les billets de phase de groupes d\u00e9butent \u00e0 environ 60 $ USD. N\u2019achetez que via les canaux officiels.',
    },
    {
      question: 'Ai-je besoin d\u2019un visa pour assister aux matchs ?',
      answer:
        'Cela d\u00e9pend de votre nationalit\u00e9 et du pays h\u00f4te visit\u00e9. Les titulaires d\u2019un passeport marocain ont besoin d\u2019un visa pour les \u00c9tats-Unis et le Canada mais peuvent entrer au Mexique sans visa. Les citoyens europ\u00e9ens b\u00e9n\u00e9ficient de l\u2019ESTA (\u00c9tats-Unis) et de l\u2019AVE (Canada).',
    },
    {
      question: 'Le groupe du Maroc sera-t-il difficile ?',
      answer:
        'Le Groupe C comprend le Br\u00e9sil (5 fois champion), Ha\u00efti (d\u00e9butant) et l\u2019\u00c9cosse (de retour apr\u00e8s 28 ans). Le Br\u00e9sil est le grand favori, mais le p\u00e9digr\u00e9e du Maroc en 2022 en fait un s\u00e9rieux candidat \u00e0 la 2e place.',
    },
    {
      question: 'Quelles sont les r\u00e8gles de d\u00e9partage ?',
      answer:
        'Les groupes sont d\u00e9cid\u00e9s par : points, diff\u00e9rence de buts, buts marqu\u00e9s, confrontation directe, points fair-play, puis tirage au sort. Les meilleurs troisi\u00e8mes sont class\u00e9s entre les 12 groupes selon les m\u00eames crit\u00e8res.',
    },
    {
      question: 'Pourquoi trois pays organisateurs ?',
      answer:
        'Les \u00c9tats-Unis, le Canada et le Mexique ont soumis une candidature conjointe (United 2026) s\u00e9lectionn\u00e9e par la FIFA en 2018. Le mod\u00e8le tri-national r\u00e9partit les co\u00fbts et les infrastructures. Il cr\u00e9e un pr\u00e9c\u00e9dent suivi par la Coupe du Monde 2030 (Espagne, Portugal, Maroc).',
    },
    {
      question: 'Quel stade accueille la finale ?',
      answer:
        'Le MetLife Stadium \u00e0 East Rutherford, New Jersey, d\u2019une capacit\u00e9 de 82 500 places. Il accueille \u00e9galement une demi-finale.',
    },
    {
      question: 'Le tournoi est-il accessible aux personnes handicap\u00e9es ?',
      answer:
        'La FIFA exige que tous les stades offrent des si\u00e8ges, entr\u00e9es et installations accessibles. Des billets accessibles sont disponibles via la plateforme officielle \u00e0 tarif r\u00e9duit. Chaque stade dispose de coordinateurs d\u2019accessibilit\u00e9.',
    },
    {
      question: 'Voyager en famille ?',
      answer:
        'Les villes h\u00f4tes proposent des fan zones familiales avec animations gratuites. De nombreux stades sont proches des transports en commun. R\u00e9server h\u00e9bergement et vols int\u00e9rieurs t\u00f4t est fortement recommand\u00e9 vu la fen\u00eatre de 39 jours du tournoi.',
    },
    {
      question: 'Le calendrier peut-il changer \u00e0 la derni\u00e8re minute ?',
      answer:
        'La FIFA se r\u00e9serve le droit d\u2019ajuster les horaires des matchs. Consultez toujours FIFA.com pour le calendrier officiel \u00e0 jour. Atlas Kings met \u00e0 jour automatiquement les horaires depuis les flux de donn\u00e9es officiels.',
    },
    {
      question: 'Que se passe-t-il apr\u00e8s 2026 pour le Maroc ?',
      answer:
        'Le Maroc co-organise la Coupe du Monde 2030 avec l\u2019Espagne et le Portugal, devenant le premier pays africain \u00e0 accueillir le tournoi. Des matchs d\u2019ouverture se tiendront en Argentine, en Uruguay et au Paraguay pour c\u00e9l\u00e9brer le centenaire de la premi\u00e8re Coupe du Monde.',
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

// New shape for EN + FR, legacy for AR until Chunk D
const ABOUT_CONTENT_REGISTRY: Record<number, Record<Locale, AboutContent>> = {
  1: {
    en: WC_2026_EN,
    fr: WC_2026_FR,
    // AR: convert legacy to new shape at runtime
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
