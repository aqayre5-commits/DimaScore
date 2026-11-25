/**
 * Bundesliga 2026/27 season kits (API-Football competition 78). Generated from cited Wikipedia kit
 * templates on 2026-11-25; see ./README.md for the sourcing rules. Flat primaries only: stripes,
 * hoops, sleeve colours and trim in the source overlay are noted per entry but never drawn.
 * Slots that could not be confirmed for 2026/27 are left out (see ./coverage.ts).
 */
import type { SeasonKitSet } from '../season-kits';
import { k } from './helpers';

export const BUNDESLIGA_KITS: readonly SeasonKitSet[] = [
  {
    teamId: 165, // Borussia Dortmund
    season: 2026,
    sourceName: 'Wikipedia: Borussia Dortmund (kit templates, rev 1386510813)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Borussia_Dortmund&oldid=1386510813',
    notes:
      'home #ffe300 from the club-infobox template (overlay _bvb2627h not drawn), number #000000 = template trim | away #000000 from the club-infobox template (overlay _bvb2627a not drawn), number #f5f5f5 = black/white for AA | third #843daf from the club-infobox template (overlay _bvb2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ffe300', '#000000'),
      away: k('#000000', '#f5f5f5'),
      third: k('#843daf', '#f5f5f5'),
    },
  },
  {
    teamId: 157, // Bayern München
    season: 2026,
    sourceName: 'Wikipedia: FC Bayern Munich (kit templates, rev 1387638886)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=FC_Bayern_Munich&oldid=1387638886',
    notes:
      'home #ff0000 from the club-infobox template (overlay _bayern2627h not drawn), number #111111 = black/white for AA | away #ffffff from the club-infobox template (overlay _bayern2627a not drawn), number #000f5a = template trim | third #13003b from the club-infobox template (overlay _bayern2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ff0000', '#111111'),
      away: k('#ffffff', '#000f5a'),
      third: k('#13003b', '#f5f5f5'),
    },
  },
  {
    teamId: 160, // SC Freiburg
    season: 2026,
    sourceName: 'Wikipedia: SC Freiburg (kit templates, rev 1384178853)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=SC_Freiburg&oldid=1384178853',
    notes:
      'home #fe0000 from the club-infobox template (overlay _freiburg2627h not drawn), number #111111 = black/white for AA | third #000000 from the club-infobox template (overlay _freiburg2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#fe0000', '#111111'),
      third: k('#000000', '#f5f5f5'),
    },
  },
  {
    teamId: 173, // RB Leipzig
    season: 2026,
    sourceName: 'Wikipedia: RB Leipzig (kit templates, rev 1386636287)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=RB_Leipzig&oldid=1386636287',
    notes:
      'home #ffffff from the club-infobox template (overlay _rbl2627hh not drawn), number #111111 = black/white for AA | away #ff0000 from the club-infobox template (overlay _rbl2627a not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#ffffff', '#111111'),
      away: k('#ff0000', '#111111'),
    },
  },
  {
    teamId: 168, // Bayer Leverkusen
    season: 2026,
    sourceName: 'Wikipedia: Bayer 04 Leverkusen (kit templates, rev 1386059004)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Bayer_04_Leverkusen&oldid=1386059004',
    notes:
      'home #000000 from the club-infobox template (overlay _bayer2627h not drawn), number #f5f5f5 = black/white for AA | away #d8e6e5 from the club-infobox template (overlay _bayer2627a not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#000000', '#f5f5f5'),
      away: k('#d8e6e5', '#111111'),
    },
  },
  {
    teamId: 162, // Werder Bremen
    season: 2026,
    sourceName: 'Wikipedia: SV Werder Bremen (kit templates, rev 1386075379)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=SV_Werder_Bremen&oldid=1386075379',
    notes:
      'home #ffffff from the club-infobox template (overlay _werder2627h not drawn; sleeves #009a59 not drawn), number #111111 = black/white for AA | away #004432 from the club-infobox template (overlay _werder2627a not drawn), number #f5f5f5 = black/white for AA | third #ff7070 from the club-infobox template (overlay _werder2627t not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#ffffff', '#111111'),
      away: k('#004432', '#f5f5f5'),
      third: k('#ff7070', '#111111'),
    },
  },
  {
    teamId: 169, // Eintracht Frankfurt
    season: 2026,
    sourceName: 'Wikipedia: Eintracht Frankfurt (kit templates, rev 1386829684)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Eintracht_Frankfurt&oldid=1386829684',
    notes:
      'home #000000 from the club-infobox template (overlay _frankfurt2627h not drawn), number #f5f5f5 = black/white for AA | away #ffffff from the club-infobox template (overlay _frankfurt2627a not drawn), number #000000 = template trim',
    player: {
      home: k('#000000', '#f5f5f5'),
      away: k('#ffffff', '#000000'),
    },
  },
  {
    teamId: 172, // VfB Stuttgart
    season: 2026,
    sourceName: 'Wikipedia: VfB Stuttgart (kit templates, rev 1383645356)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=VfB_Stuttgart&oldid=1383645356',
    notes:
      'home #ffffff from the club-infobox template (overlay _stuttgart2627h not drawn), number #111111 = black/white for AA | away #ff0000 from the club-infobox template (overlay _stuttgart2627a not drawn), number #111111 = black/white for AA | third #d2a564 from the club-infobox template (overlay _stuttgart2627t not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#ffffff', '#111111'),
      away: k('#ff0000', '#111111'),
      third: k('#d2a564', '#111111'),
    },
  },
  {
    teamId: 1660, // SV Elversberg
    season: 2026,
    sourceName: 'Wikipedia: SV Elversberg (kit templates, rev 1383333899)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=SV_Elversberg&oldid=1383333899',
    notes:
      'home #ffffff from the club-infobox template (overlay _elvesberg2627h not drawn), number #111111 = black/white for AA | away #000000 from the club-infobox template (overlay _elversberg2627a not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ffffff', '#111111'),
      away: k('#000000', '#f5f5f5'),
    },
  },
  {
    teamId: 170, // FC Augsburg
    season: 2026,
    sourceName: 'Wikipedia: FC Augsburg (kit templates, rev 1385030171)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=FC_Augsburg&oldid=1385030171',
    notes:
      'home #ede6dc from the club-infobox template (overlay _augsburg2627h not drawn), number #680f00 = template trim | away #016c76 from the club-infobox template (overlay _augsburg2627a not drawn), number #f5f5f5 = black/white for AA | third #5c111b from the club-infobox template (overlay _augsburg2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ede6dc', '#680f00'),
      away: k('#016c76', '#f5f5f5'),
      third: k('#5c111b', '#f5f5f5'),
    },
  },
  {
    teamId: 167, // 1899 Hoffenheim
    season: 2026,
    sourceName: 'Wikipedia: TSG 1899 Hoffenheim (kit templates, rev 1383481756)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=TSG_1899_Hoffenheim&oldid=1383481756',
    notes:
      'home #0000ff from the club-infobox template (overlay _hoffenheim2627h not drawn; sleeves #ffffff not drawn), number #f5f5f5 = black/white for AA | away #e0d9cc from the club-infobox template (overlay _hoffenheim2627a not drawn), number #111111 = black/white for AA | third #b7b5e8 from the club-infobox template (overlay _hoffenheim2627t not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#0000ff', '#f5f5f5'),
      away: k('#e0d9cc', '#111111'),
      third: k('#b7b5e8', '#111111'),
    },
  },
  {
    teamId: 175, // Hamburger SV
    season: 2026,
    sourceName: 'Wikipedia: Hamburger SV (kit templates, rev 1386701863)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Hamburger_SV&oldid=1386701863',
    notes:
      'home #ffffff from the club-infobox template (overlay _hsv2627h not drawn), number #0000ff = template trim | away #0000ff from the club-infobox template (overlay _hsv2627a not drawn; sleeves #000000 not drawn), number #f5f5f5 = black/white for AA | third #000000 from the club-infobox template (overlay _hsv2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ffffff', '#0000ff'),
      away: k('#0000ff', '#f5f5f5'),
      third: k('#000000', '#f5f5f5'),
    },
  },
  {
    teamId: 164, // FSV Mainz 05
    season: 2026,
    sourceName: 'Wikipedia: 1. FSV Mainz 05 (kit templates, rev 1387540862)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=1._FSV_Mainz_05&oldid=1387540862',
    notes:
      'home #ff0000 from the club-infobox template (overlay _mainz2627h not drawn), number #111111 = black/white for AA | away #ffffff from the club-infobox template (overlay _mainz2627a not drawn), number #111111 = black/white for AA | third #555555 from the club-infobox template (overlay _mainz2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ff0000', '#111111'),
      away: k('#ffffff', '#111111'),
      third: k('#555555', '#f5f5f5'),
    },
  },
  {
    teamId: 192, // 1. FC Köln
    season: 2026,
    sourceName: 'Wikipedia: 1. FC Köln (kit templates, rev 1385969724)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=1._FC_K%C3%B6ln&oldid=1385969724',
    notes:
      'home #ffffff from the club-infobox template (overlay _koeln2627h not drawn), number #111111 = black/white for AA | away #ff0000 from the club-infobox template (overlay _koeln2627a not drawn), number #111111 = black/white for AA | third #000055 from the club-infobox template (overlay _koeln2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ffffff', '#111111'),
      away: k('#ff0000', '#111111'),
      third: k('#000055', '#f5f5f5'),
    },
  },
  {
    teamId: 185, // SC Paderborn 07
    season: 2026,
    sourceName: 'Wikipedia: SC Paderborn 07 (kit templates, rev 1386415255)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=SC_Paderborn_07&oldid=1386415255',
    notes:
      'home #000000 from the club-infobox template (overlay _paderborn2627h not drawn), number #f5f5f5 = black/white for AA | away #ff0000 from the club-infobox template (overlay _paderborn2627a not drawn), number #111111 = black/white for AA | third #bad6e6 from the club-infobox template (overlay _paderborn2627t not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#000000', '#f5f5f5'),
      away: k('#ff0000', '#111111'),
      third: k('#bad6e6', '#111111'),
    },
  },
  {
    teamId: 174, // FC Schalke 04
    season: 2026,
    sourceName: 'Wikipedia: FC Schalke 04 (kit templates, rev 1386392910)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=FC_Schalke_04&oldid=1386392910',
    notes:
      'home #0000dd from the club-infobox template (overlay _schalke2627h not drawn), number #f5f5f5 = black/white for AA | third #abff00 from the club-infobox template (overlay _schalke2627t not drawn), number #0000dd = template trim',
    player: {
      home: k('#0000dd', '#f5f5f5'),
      third: k('#abff00', '#0000dd'),
    },
  },
  {
    teamId: 182, // Union Berlin
    season: 2026,
    sourceName: 'Wikipedia: 1. FC Union Berlin (kit templates, rev 1386056698)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=1._FC_Union_Berlin&oldid=1386056698',
    notes:
      'home #ff0000 from the club-infobox template (overlay _unionberlin2627h not drawn), number #111111 = black/white for AA | away #444444 from the club-infobox template (overlay _unionberlin2627a not drawn), number #f5f5f5 = black/white for AA | third #ffee00 from the club-infobox template (overlay _unionberlin2627t not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#ff0000', '#111111'),
      away: k('#444444', '#f5f5f5'),
      third: k('#ffee00', '#111111'),
    },
  },
  {
    teamId: 163, // Borussia Mönchengladbach
    season: 2026,
    sourceName: 'Wikipedia: Borussia Mönchengladbach (kit templates, rev 1386102097)',
    sourceUrl:
      'https://en.wikipedia.org/w/index.php?title=Borussia_M%C3%B6nchengladbach&oldid=1386102097',
    notes:
      'home #ffffff from the club-infobox template (overlay _gladbach2627h not drawn), number #111111 = black/white for AA | away #000000 from the club-infobox template (overlay _gladbach2627a not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ffffff', '#111111'),
      away: k('#000000', '#f5f5f5'),
    },
  },
];
