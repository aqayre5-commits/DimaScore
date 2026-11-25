/**
 * LaLiga 2026/27 season kits (API-Football competition 140). Generated from cited Wikipedia kit
 * templates on 2026-11-25; see ./README.md for the sourcing rules. Flat primaries only: stripes,
 * hoops, sleeve colours and trim in the source overlay are noted per entry but never drawn.
 * Slots that could not be confirmed for 2026/27 are left out (see ./coverage.ts).
 */
import type { SeasonKitSet } from '../season-kits';
import { k } from './helpers';

export const LA_LIGA_KITS: readonly SeasonKitSet[] = [
  {
    teamId: 529, // Barcelona
    season: 2026,
    sourceName: 'Wikipedia: 2026–27 FC Barcelona season (kit templates, rev 1387431025)',
    sourceUrl:
      'https://en.wikipedia.org/w/index.php?title=2026%E2%80%9327_FC_Barcelona_season&oldid=1387431025',
    notes:
      'home #14266e from the season-page template (overlay _barcelona2627h not drawn), number #f5f5f5 = black/white for AA | away #000000 from the season-page template (overlay _barcelona2627a not drawn), number #f5f5f5 = black/white for AA | third #ef8377 from the season-page template (overlay _barcelona2627t not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#14266e', '#f5f5f5'),
      away: k('#000000', '#f5f5f5'),
      third: k('#ef8377', '#111111'),
    },
  },
  {
    teamId: 541, // Real Madrid
    season: 2026,
    sourceName: 'Wikipedia: 2026–27 Real Madrid CF season (kit templates, rev 1387634523)',
    sourceUrl:
      'https://en.wikipedia.org/w/index.php?title=2026%E2%80%9327_Real_Madrid_CF_season&oldid=1387634523',
    notes:
      'home #ffffff from the club-infobox template (overlay _realmadrid2627h not drawn), number #111111 = black/white for AA | away #162e32 from the season-page template (overlay _realmadrid2627a not drawn), number #f5f5f5 = black/white for AA | infobox slots cite https://en.wikipedia.org/w/index.php?title=Real_Madrid_CF&oldid=1387569935 | goalkeeper: season-page GK templates in listed order (first three that differ from the outfield shirts) mapped to home/away/third; the GK kit actually worn is not verified',
    player: {
      home: k('#ffffff', '#111111'),
      away: k('#162e32', '#f5f5f5'),
    },
    goalkeeper: {
      home: k('#fb8345', '#111111'), // Goalkeeper 2
      away: k('#0fb1ff', '#111111'), // Goalkeeper 4
      third: k('#fff900', '#111111'), // Goalkeeper 5
    },
  },
  {
    teamId: 530, // Atletico Madrid
    season: 2026,
    sourceName: 'Wikipedia: 2026–27 Atlético Madrid season (kit templates, rev 1387201776)',
    sourceUrl:
      'https://en.wikipedia.org/w/index.php?title=2026%E2%80%9327_Atl%C3%A9tico_Madrid_season&oldid=1387201776',
    notes:
      'home #ff0000 from the season-page template (overlay _atleticomadrid2627h not drawn), number #111111 = black/white for AA | away #000000 from the season-page template (overlay _atleticomadrid2627a not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ff0000', '#111111'),
      away: k('#000000', '#f5f5f5'),
    },
  },
  {
    teamId: 543, // Real Betis
    season: 2026,
    sourceName: 'Wikipedia: Real Betis (kit templates, rev 1386711476)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Real_Betis&oldid=1386711476',
    notes:
      'home #359b5c from the club-infobox template (overlay _betis2627h not drawn), number #111111 = black/white for AA | away #005c29 from the club-infobox template (overlay _betis2627a not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#359b5c', '#111111'),
      away: k('#005c29', '#f5f5f5'),
    },
  },
  {
    teamId: 548, // Real Sociedad
    season: 2026,
    sourceName: 'Wikipedia: Real Sociedad (kit templates, rev 1383840546)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Real_Sociedad&oldid=1383840546',
    notes:
      'home #0042ff from the club-infobox template (overlay _realsociedad2627h not drawn), number #ffffff = template trim | away #000000 from the club-infobox template (overlay _realsociedad2627a not drawn), number #f5f5f5 = black/white for AA | third #b61d2f from the club-infobox template (overlay _realsociedad2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#0042ff', '#ffffff'),
      away: k('#000000', '#f5f5f5'),
      third: k('#b61d2f', '#f5f5f5'),
    },
  },
  {
    teamId: 536, // Sevilla
    season: 2026,
    sourceName: 'Wikipedia: Sevilla FC (kit templates, rev 1385490242)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Sevilla_FC&oldid=1385490242',
    notes:
      'home #ffffff from the club-infobox template (overlay _sevilla2627h not drawn; sleeves #e20001 not drawn), number #e20000 = template trim | away #e20001 from the club-infobox template (overlay _sevilla2627a not drawn), number #f5f5f5 = black/white for AA | third #000000 from the club-infobox template (overlay _sevilla2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ffffff', '#e20000'),
      away: k('#e20001', '#f5f5f5'),
      third: k('#000000', '#f5f5f5'),
    },
  },
  {
    teamId: 531, // Athletic Club
    season: 2026,
    sourceName: 'Wikipedia: Athletic Bilbao (kit templates, rev 1387349437)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Athletic_Bilbao&oldid=1387349437',
    notes:
      'home #ffffff from the club-infobox template (overlay _bilbao2627h not drawn), number #000000 = template trim | away #000000 from the club-infobox template (overlay _bilbao2627a not drawn), number #ff0000 = template trim',
    player: {
      home: k('#ffffff', '#000000'),
      away: k('#000000', '#ff0000'),
    },
  },
  {
    teamId: 533, // Villarreal
    season: 2026,
    sourceName: 'Wikipedia: Villarreal CF (kit templates, rev 1387093971)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Villarreal_CF&oldid=1387093971',
    notes:
      'home #ffff00 from the club-infobox template (overlay _villarreal2627h not drawn), number #111111 = black/white for AA | away #cbcbcb from the club-infobox template (overlay _villarreal2627a not drawn; sleeves #1880ff not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#ffff00', '#111111'),
      away: k('#cbcbcb', '#111111'),
    },
  },
  {
    teamId: 539, // Levante
    season: 2026,
    sourceName: 'Wikipedia: Levante UD (kit templates, rev 1385674431)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Levante_UD&oldid=1385674431',
    notes:
      'home #222730 from the club-infobox template (overlay _levante2627h not drawn; sleeves #661424 not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#222730', '#f5f5f5'),
    },
  },
  {
    teamId: 728, // Rayo Vallecano
    season: 2026,
    sourceName: 'Wikipedia: Rayo Vallecano (kit templates, rev 1385794120)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Rayo_Vallecano&oldid=1385794120',
    notes:
      'home #ffffff from the club-infobox template (overlay _rayo2627h not drawn), number #111111 = black/white for AA | away #ff0000 from the club-infobox template (overlay _rayo2627a not drawn), number #111111 = black/white for AA | third #f1c463 from the club-infobox template (overlay _rayo2627t not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#ffffff', '#111111'),
      away: k('#ff0000', '#111111'),
      third: k('#f1c463', '#111111'),
    },
  },
  {
    teamId: 532, // Valencia
    season: 2026,
    sourceName: 'Wikipedia: Valencia CF (kit templates, rev 1386917540)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Valencia_CF&oldid=1386917540',
    notes:
      'home #ffffff from the club-infobox template (overlay _valencia2627h not drawn), number #000000 = template trim | away #024560 from the club-infobox template (overlay _valencia2627a not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ffffff', '#000000'),
      away: k('#024560', '#f5f5f5'),
    },
  },
  {
    teamId: 546, // Getafe
    season: 2026,
    sourceName: 'Wikipedia: Getafe CF (kit templates, rev 1386953550)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Getafe_CF&oldid=1386953550',
    notes:
      'home #0000ff from the club-infobox template (overlay _getafe2627h not drawn), number #f5f5f5 = black/white for AA | away #7b0018 from the club-infobox template (overlay _getafe2627a not drawn), number #f5f5f5 = black/white for AA | third #c2daff from the club-infobox template (overlay _getafe2627t not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#0000ff', '#f5f5f5'),
      away: k('#7b0018', '#f5f5f5'),
      third: k('#c2daff', '#111111'),
    },
  },
  {
    teamId: 797, // Elche
    season: 2026,
    sourceName: 'Wikipedia: Elche CF (kit templates, rev 1387065968)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Elche_CF&oldid=1387065968',
    notes:
      'away #5f04b4 from the club-infobox template (overlay _elche2627a not drawn), number #f5f5f5 = black/white for AA | third #000000 from the club-infobox template (overlay _elche2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      away: k('#5f04b4', '#f5f5f5'),
      third: k('#000000', '#f5f5f5'),
    },
  },
  {
    teamId: 535, // Malaga
    season: 2026,
    sourceName: 'Wikipedia: Málaga CF (kit templates, rev 1386964986)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=M%C3%A1laga_CF&oldid=1386964986',
    notes:
      'home #ffffff from the club-infobox template (overlay _malaga2627h not drawn), number #103e9e = template trim',
    player: {
      home: k('#ffffff', '#103e9e'),
    },
  },
];
