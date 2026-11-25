/**
 * Premier League 2026/27 season kits (API-Football competition 39). Generated from cited Wikipedia kit
 * templates on 2026-11-25; see ./README.md for the sourcing rules. Flat primaries only: stripes,
 * hoops, sleeve colours and trim in the source overlay are noted per entry but never drawn.
 * Slots that could not be confirmed for 2026/27 are left out (see ./coverage.ts).
 */
import type { SeasonKitSet } from '../season-kits';
import { k } from './helpers';

export const PREMIER_LEAGUE_KITS: readonly SeasonKitSet[] = [
  {
    teamId: 42, // Arsenal
    season: 2026,
    sourceName: 'Wikipedia: 2026–27 Arsenal F.C. season (kit templates, rev 1387635589)',
    sourceUrl:
      'https://en.wikipedia.org/w/index.php?title=2026%E2%80%9327_Arsenal_F.C._season&oldid=1387635589',
    notes:
      'home #f00000 from the season-page template (overlay _arsenal2627h not drawn; sleeves #ffffff not drawn), number #000000 = black/white for AA | away #0d1b5c from the season-page template (overlay _arsenal2627a not drawn), number #f5f5f5 = black/white for AA | third #f6f4c2 from the season-page template (overlay _arsenal2627t not drawn), number #13223f = template trim | goalkeeper: season-page GK templates in listed order (first three that differ from the outfield shirts) mapped to home/away/third; the GK kit actually worn is not verified',
    player: {
      home: k('#f00000', '#000000'),
      away: k('#0d1b5c', '#f5f5f5'),
      third: k('#f6f4c2', '#13223f'),
    },
    goalkeeper: {
      home: k('#ffffff', '#111111'), // Goalkeeper 1
      away: k('#cc50cc', '#111111'), // Goalkeeper 2
      third: k('#0fb1ff', '#111111'), // Goalkeeper 3
    },
  },
  {
    teamId: 51, // Brighton
    season: 2026,
    sourceName: 'Wikipedia: Brighton & Hove Albion F.C. (kit templates, rev 1386971176)',
    sourceUrl:
      'https://en.wikipedia.org/w/index.php?title=Brighton_%26_Hove_Albion_F.C.&oldid=1386971176',
    notes:
      'home #1144dd from the club-infobox template (overlay _brighton2627h not drawn), number #f5f5f5 = black/white for AA | away #ffffff from the club-infobox template (overlay _brighton2627a not drawn), number #1144dd = template trim | third #00587e from the club-infobox template (overlay _brighton2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#1144dd', '#f5f5f5'),
      away: k('#ffffff', '#1144dd'),
      third: k('#00587e', '#f5f5f5'),
    },
  },
  {
    teamId: 40, // Liverpool
    season: 2026,
    sourceName: 'Wikipedia: Liverpool F.C. (kit templates, rev 1387532653)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Liverpool_F.C.&oldid=1387532653',
    notes:
      'home #8f1e32 from the club-infobox template (overlay _liverpool2627h not drawn), number #f5f5f5 = black/white for AA | away #ffffff from the club-infobox template (overlay _liverpool2627a not drawn), number #dd0000 = template trim | third #000000 from the club-infobox template (overlay _liverpool2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#8f1e32', '#f5f5f5'),
      away: k('#ffffff', '#dd0000'),
      third: k('#000000', '#f5f5f5'),
    },
  },
  {
    teamId: 35, // Bournemouth
    season: 2026,
    sourceName: 'Wikipedia: AFC Bournemouth (kit templates, rev 1386948696)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=AFC_Bournemouth&oldid=1386948696',
    notes:
      'home #000000 from the club-infobox template (overlay _bournemouth2627h not drawn), number #f5f5f5 = black/white for AA | away #800080 from the club-infobox template (overlay _bournemouth2627a not drawn), number #f5f5f5 = black/white for AA | third #faf9f6 from the club-infobox template (overlay _bournemouth2627t not drawn), number #000000 = template trim',
    player: {
      home: k('#000000', '#f5f5f5'),
      away: k('#800080', '#f5f5f5'),
      third: k('#faf9f6', '#000000'),
    },
  },
  {
    teamId: 55, // Brentford
    season: 2026,
    sourceName: 'Wikipedia: Brentford F.C. (kit templates, rev 1386879872)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Brentford_F.C.&oldid=1386879872',
    notes:
      'home #ffffff from the club-infobox template (overlay _brentford2627h not drawn), number #000000 = template trim | away #000080 from the club-infobox template (overlay _brentford2627a not drawn), number #f5f5f5 = black/white for AA | third #ffed29 from the club-infobox template (overlay _brentford2627t not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#ffffff', '#000000'),
      away: k('#000080', '#f5f5f5'),
      third: k('#ffed29', '#111111'),
    },
  },
  {
    teamId: 49, // Chelsea
    season: 2026,
    sourceName: 'Wikipedia: 2026–27 Chelsea F.C. season (kit templates, rev 1387565886)',
    sourceUrl:
      'https://en.wikipedia.org/w/index.php?title=2026%E2%80%9327_Chelsea_F.C._season&oldid=1387565886',
    notes:
      'home #2054cc from the season-page template (overlay _chelsea2627h not drawn), number #ffffff = template trim | away #000000 from the season-page template (overlay _chelsea2627a not drawn), number #f0d104 = template trim',
    player: {
      home: k('#2054cc', '#ffffff'),
      away: k('#000000', '#f0d104'),
    },
  },
  {
    teamId: 45, // Everton
    season: 2026,
    sourceName: 'Wikipedia: Everton F.C. (kit templates, rev 1385498207)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Everton_F.C.&oldid=1385498207',
    notes:
      'home #0000ff from the club-infobox template (overlay _everton2627h not drawn), number #ffffff = template trim | away #ffffff from the club-infobox template (overlay _everton2627a not drawn), number #090040 = template trim | third #006400 from the club-infobox template (overlay _everton2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#0000ff', '#ffffff'),
      away: k('#ffffff', '#090040'),
      third: k('#006400', '#f5f5f5'),
    },
  },
  {
    teamId: 47, // Tottenham
    season: 2026,
    sourceName: 'Wikipedia: Tottenham Hotspur F.C. (kit templates, rev 1387561557)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Tottenham_Hotspur_F.C.&oldid=1387561557',
    notes:
      'home #ffffff from the club-infobox template (overlay _tottenham2627h not drawn), number #111111 = black/white for AA | away #000000 from the club-infobox template (overlay _tottenham2627a not drawn), number #f5f5f5 = black/white for AA | third #800080 from the club-infobox template (overlay _tottenham2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ffffff', '#111111'),
      away: k('#000000', '#f5f5f5'),
      third: k('#800080', '#f5f5f5'),
    },
  },
  {
    teamId: 64, // Hull City
    season: 2026,
    sourceName: 'Wikipedia: Hull City A.F.C. (kit templates, rev 1387496407)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Hull_City_A.F.C.&oldid=1387496407',
    notes:
      'home #000000 from the club-infobox template (overlay _hull2627h not drawn), number #ffffff = template trim | away #ffffff from the club-infobox template (overlay _hull2627a not drawn), number #000000 = template trim | third #305cde from the club-infobox template (overlay _hull2627t not drawn), number #ffffff = template trim',
    player: {
      home: k('#000000', '#ffffff'),
      away: k('#ffffff', '#000000'),
      third: k('#305cde', '#ffffff'),
    },
  },
  {
    teamId: 66, // Aston Villa
    season: 2026,
    sourceName: 'Wikipedia: Aston Villa F.C. (kit templates, rev 1387411079)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Aston_Villa_F.C.&oldid=1387411079',
    notes:
      'home #69091c from the club-infobox template (overlay _astonvilla2627h not drawn), number #bbd5f2 = template trim | away #000000 from the club-infobox template (overlay _astonvilla2627A not drawn), number #f5f5f5 = black/white for AA | third #bbd5f2 from the club-infobox template (overlay _astonvilla2627t not drawn), number #69091c = template trim',
    player: {
      home: k('#69091c', '#bbd5f2'),
      away: k('#000000', '#f5f5f5'),
      third: k('#bbd5f2', '#69091c'),
    },
  },
  {
    teamId: 34, // Newcastle
    season: 2026,
    sourceName: 'Wikipedia: Newcastle United F.C. (kit templates, rev 1386780888)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Newcastle_United_F.C.&oldid=1386780888',
    notes:
      'home #ffffff from the club-infobox template (overlay _newcastle2627h not drawn), number #000000 = template trim | away #152640 from the club-infobox template (overlay _newcastle2627a not drawn), number #f5f5f5 = black/white for AA | third #cbc3e3 from the club-infobox template (overlay _newcastle2627t not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#ffffff', '#000000'),
      away: k('#152640', '#f5f5f5'),
      third: k('#cbc3e3', '#111111'),
    },
  },
  {
    teamId: 1346, // Coventry
    season: 2026,
    sourceName: 'Wikipedia: Coventry City F.C. (kit templates, rev 1385458115)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Coventry_City_F.C.&oldid=1385458115',
    notes:
      'home #62b5e5 from the club-infobox template (overlay _coventry2627h not drawn), number #111111 = black/white for AA | away #f5f3f1 from the club-infobox template (overlay _coventry2627a not drawn), number #111111 = black/white for AA | third #e795df from the club-infobox template (overlay _coventry2627t not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#62b5e5', '#111111'),
      away: k('#f5f3f1', '#111111'),
      third: k('#e795df', '#111111'),
    },
  },
  {
    teamId: 57, // Ipswich
    season: 2026,
    sourceName: 'Wikipedia: Ipswich Town F.C. (kit templates, rev 1386956541)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Ipswich_Town_F.C.&oldid=1386956541',
    notes:
      'home #0333a0 from the club-infobox template (overlay _ipswich2627h not drawn), number #f5f5f5 = black/white for AA | away #f7ebc8 from the club-infobox template (overlay _ipswich2627a not drawn), number #000000 = template trim | third #000000 from the club-infobox template (overlay _ipswich2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#0333a0', '#f5f5f5'),
      away: k('#f7ebc8', '#000000'),
      third: k('#000000', '#f5f5f5'),
    },
  },
  {
    teamId: 65, // Nottingham Forest
    season: 2026,
    sourceName: 'Wikipedia: Nottingham Forest F.C. (kit templates, rev 1386959795)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Nottingham_Forest_F.C.&oldid=1386959795',
    notes:
      'home #d70926 from the club-infobox template (overlay _nottingham2627h not drawn), number #ffffff = template trim | away #0a3023 from the club-infobox template (overlay _nottingham2627a not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#d70926', '#ffffff'),
      away: k('#0a3023', '#f5f5f5'),
    },
  },
  {
    teamId: 746, // Sunderland
    season: 2026,
    sourceName: 'Wikipedia: Sunderland A.F.C. (kit templates, rev 1386714607)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Sunderland_A.F.C.&oldid=1386714607',
    notes:
      'home #ff0000 from the club-infobox template (overlay _sunderland2627h not drawn), number #000000 = template trim | away #ff9fbf from the club-infobox template (overlay _sunderland2627a not drawn), number #111111 = black/white for AA | third #00008b from the club-infobox template (overlay _sunderland2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ff0000', '#000000'),
      away: k('#ff9fbf', '#111111'),
      third: k('#00008b', '#f5f5f5'),
    },
  },
  {
    teamId: 33, // Manchester United
    season: 2026,
    sourceName: 'Wikipedia: Manchester United F.C. (kit templates, rev 1387312060)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Manchester_United_F.C.&oldid=1387312060',
    notes:
      'home #ff0000 from the club-infobox template (overlay _manutd2627h not drawn), number #000000 = template trim | away #0000f0 from the club-infobox template (overlay _manutd2627a not drawn), number #f5f5f5 = black/white for AA | third #faf9f6 from the club-infobox template (overlay _manutd2627t not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#ff0000', '#000000'),
      away: k('#0000f0', '#f5f5f5'),
      third: k('#faf9f6', '#111111'),
    },
  },
  {
    teamId: 52, // Crystal Palace
    season: 2026,
    sourceName: 'Wikipedia: Crystal Palace F.C. (kit templates, rev 1387548614)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Crystal_Palace_F.C.&oldid=1387548614',
    notes:
      'home #ffffff from the club-infobox template (overlay _crystalpalace2627h not drawn), number #111111 = black/white for AA | away #000000 from the club-infobox template (overlay _crystalpalace2627a not drawn), number #f5f5f5 = black/white for AA | third #0000ff from the club-infobox template (overlay _crystalpalace2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ffffff', '#111111'),
      away: k('#000000', '#f5f5f5'),
      third: k('#0000ff', '#f5f5f5'),
    },
  },
];
