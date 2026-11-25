/**
 * Serie A 2026/27 season kits (API-Football competition 135). Generated from cited Wikipedia kit
 * templates on 2026-11-25; see ./README.md for the sourcing rules. Flat primaries only: stripes,
 * hoops, sleeve colours and trim in the source overlay are noted per entry but never drawn.
 * Slots that could not be confirmed for 2026/27 are left out (see ./coverage.ts).
 */
import type { SeasonKitSet } from '../season-kits';
import { k } from './helpers';

export const SERIE_A_KITS: readonly SeasonKitSet[] = [
  {
    teamId: 487, // Lazio
    season: 2026,
    sourceName: 'Wikipedia: SS Lazio (kit templates, rev 1387182766)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=SS_Lazio&oldid=1387182766',
    notes:
      'home #88bff7 from the club-infobox template (overlay _lazio2627h not drawn), number #111111 = black/white for AA | away #ffffff from the club-infobox template (overlay _lazio2627a not drawn), number #242d4e = template trim | third #242d4e from the club-infobox template (overlay _lazio2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#88bff7', '#111111'),
      away: k('#ffffff', '#242d4e'),
      third: k('#242d4e', '#f5f5f5'),
    },
  },
  {
    teamId: 497, // AS Roma
    season: 2026,
    sourceName: 'Wikipedia: AS Roma (kit templates, rev 1386422769)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=AS_Roma&oldid=1386422769',
    notes:
      'home #980729 from the club-infobox template (overlay _roma2627h not drawn; sleeves #681f30 not drawn), number #f5f5f5 = black/white for AA | away #ece3da from the club-infobox template (overlay _roma2627a not drawn), number #111111 = black/white for AA | third #46474b from the club-infobox template (overlay _roma2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#980729', '#f5f5f5'),
      away: k('#ece3da', '#111111'),
      third: k('#46474b', '#f5f5f5'),
    },
  },
  {
    teamId: 505, // Inter
    season: 2026,
    sourceName: 'Wikipedia: 2026–27 Inter Milan season (kit templates, rev 1387196928)',
    sourceUrl:
      'https://en.wikipedia.org/w/index.php?title=2026%E2%80%9327_Inter_Milan_season&oldid=1387196928',
    notes:
      'home #000000 from the season-page template (overlay _intermilan2627h not drawn), number #f5f5f5 = black/white for AA | away #ffffff from the season-page template (overlay _intermilan2627a not drawn), number #111111 = black/white for AA | third #707781 from the season-page template (overlay _intermilan2627t not drawn), number #000000 = template trim | goalkeeper: season-page GK templates in listed order (first three that differ from the outfield shirts) mapped to home/away/third; the GK kit actually worn is not verified',
    player: {
      home: k('#000000', '#f5f5f5'),
      away: k('#ffffff', '#111111'),
      third: k('#707781', '#000000'),
    },
    goalkeeper: {
      home: k('#ffee00', '#111111'), // Goalkeeper 1
      away: k('#008844', '#000000'), // Goalkeeper 3
      third: k('#ff62b1', '#111111'), // Goalkeeper 4
    },
  },
  {
    teamId: 489, // AC Milan
    season: 2026,
    sourceName: 'Wikipedia: AC Milan (kit templates, rev 1384637689)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=AC_Milan&oldid=1384637689',
    notes:
      'home #000000 from the club-infobox template (overlay _milan2627h not drawn), number #ffffff = template trim | third #3b3a3f from the club-infobox template (overlay _milan2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#000000', '#ffffff'),
      third: k('#3b3a3f', '#f5f5f5'),
    },
  },
  {
    teamId: 895, // Como
    season: 2026,
    sourceName: 'Wikipedia: Como 1907 (kit templates, rev 1385601039)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Como_1907&oldid=1385601039',
    notes:
      'home #215aae from the club-infobox template (overlay _como2627h not drawn), number #ffffff = template trim',
    player: {
      home: k('#215aae', '#ffffff'),
    },
  },
  {
    teamId: 496, // Juventus
    season: 2026,
    sourceName: 'Wikipedia: Juventus FC (kit templates, rev 1387411780)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Juventus_FC&oldid=1387411780',
    notes:
      'away #ffa8c6 from the club-infobox template (overlay _juventus2627a not drawn), number #000000 = template trim',
    player: {
      away: k('#ffa8c6', '#000000'),
    },
  },
  {
    teamId: 512, // Frosinone
    season: 2026,
    sourceName: 'Wikipedia: Frosinone Calcio (kit templates, rev 1385784378)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Frosinone_Calcio&oldid=1385784378',
    notes:
      'home #f5d661 from the club-infobox template (overlay _frosinone2627h not drawn), number #111111 = black/white for AA | away #fefef3 from the club-infobox template (overlay _frosinone2627a not drawn), number #111111 = black/white for AA | third #000000 from the club-infobox template (overlay _frosinone2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#f5d661', '#111111'),
      away: k('#fefef3', '#111111'),
      third: k('#000000', '#f5f5f5'),
    },
  },
  {
    teamId: 492, // Napoli
    season: 2026,
    sourceName: 'Wikipedia: SSC Napoli (kit templates, rev 1387500886)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=SSC_Napoli&oldid=1387500886',
    notes:
      'away #ffffff from the club-infobox template (overlay _Napoli2627a not drawn), number #111111 = black/white for AA | third #fe0000 from the club-infobox template (overlay _Napoli2627t not drawn), number #111111 = black/white for AA',
    player: {
      away: k('#ffffff', '#111111'),
      third: k('#fe0000', '#111111'),
    },
  },
  {
    teamId: 500, // Bologna
    season: 2026,
    sourceName: 'Wikipedia: Bologna FC 1909 (kit templates, rev 1380845587)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Bologna_FC_1909&oldid=1380845587',
    notes:
      'home #00003c from the club-infobox template (overlay _bologna2627h not drawn), number #ffffff = template trim | away #ffffff from the club-infobox template (overlay _bologna2627a not drawn), number #00003c = template trim | third #edc679 from the club-infobox template (overlay _bologna2627t not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#00003c', '#ffffff'),
      away: k('#ffffff', '#00003c'),
      third: k('#edc679', '#111111'),
    },
  },
  {
    teamId: 495, // Genoa
    season: 2026,
    sourceName: 'Wikipedia: Genoa CFC (kit templates, rev 1385815450)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Genoa_CFC&oldid=1385815450',
    notes:
      'home #ffffff from the club-infobox template (overlay _genoa2627h not drawn), number #000040 = template trim',
    player: {
      home: k('#ffffff', '#000040'),
    },
  },
  {
    teamId: 490, // Cagliari
    season: 2026,
    sourceName: 'Wikipedia: Cagliari Calcio (kit templates, rev 1384110279)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Cagliari_Calcio&oldid=1384110279',
    notes:
      'home #022249 from the club-infobox template (overlay _cagliari2627h not drawn), number #f5f5f5 = black/white for AA | away #ffffff from the club-infobox template (overlay _cagliari2627a not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#022249', '#f5f5f5'),
      away: k('#ffffff', '#111111'),
    },
  },
  {
    teamId: 499, // Atalanta
    season: 2026,
    sourceName: 'Wikipedia: Atalanta BC (kit templates, rev 1386881081)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Atalanta_BC&oldid=1386881081',
    notes:
      'away #ffffff from the club-infobox template (overlay _atalanta2627a not drawn), number #111111 = black/white for AA | third #ff8f00 from the club-infobox template (overlay _atalanta2627t not drawn), number #111111 = black/white for AA',
    player: {
      away: k('#ffffff', '#111111'),
      third: k('#ff8f00', '#111111'),
    },
  },
  {
    teamId: 503, // Torino
    season: 2026,
    sourceName: 'Wikipedia: Torino FC (kit templates, rev 1387597263)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Torino_FC&oldid=1387597263',
    notes:
      'home #65001b from the club-infobox template (overlay _torino2627h not drawn), number #f5f5f5 = black/white for AA | third #191919 from the club-infobox template (overlay _torino2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#65001b', '#f5f5f5'),
      third: k('#191919', '#f5f5f5'),
    },
  },
  {
    teamId: 1579, // Monza
    season: 2026,
    sourceName: 'Wikipedia: AC Monza (kit templates, rev 1385854579)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=AC_Monza&oldid=1385854579',
    notes:
      'home #ff0000 from the club-infobox template (overlay _monza2627h not drawn), number #111111 = black/white for AA | away #ffffff from the club-infobox template (overlay _monza2627a not drawn), number #111111 = black/white for AA | third #000000 from the club-infobox template (overlay _monza2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ff0000', '#111111'),
      away: k('#ffffff', '#111111'),
      third: k('#000000', '#f5f5f5'),
    },
  },
  {
    teamId: 867, // Lecce
    season: 2026,
    sourceName: 'Wikipedia: US Lecce (kit templates, rev 1384110187)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=US_Lecce&oldid=1384110187',
    notes:
      'home #ffff00 from the club-infobox template (overlay _lecce2627h not drawn), number #000055 = template trim | away #ffffff from the club-infobox template (overlay _lecce2627a not drawn), number #111111 = black/white for AA | third #000055 from the club-infobox template (overlay _lecce2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ffff00', '#000055'),
      away: k('#ffffff', '#111111'),
      third: k('#000055', '#f5f5f5'),
    },
  },
  {
    teamId: 502, // Fiorentina
    season: 2026,
    sourceName: 'Wikipedia: ACF Fiorentina (kit templates, rev 1386326909)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=ACF_Fiorentina&oldid=1386326909',
    notes:
      'home #552a79 from the club-infobox template (overlay _fiorentina2627h not drawn), number #f5f5f5 = black/white for AA | away #ffffff from the club-infobox template (overlay _fiorentina2627a not drawn), number #111111 = black/white for AA | third #0000df from the club-infobox template (overlay _fiorentina2627T not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#552a79', '#f5f5f5'),
      away: k('#ffffff', '#111111'),
      third: k('#0000df', '#f5f5f5'),
    },
  },
  {
    teamId: 523, // Parma
    season: 2026,
    sourceName: 'Wikipedia: Parma Calcio 1913 (kit templates, rev 1386959983)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Parma_Calcio_1913&oldid=1386959983',
    notes:
      'home #ffffff from the club-infobox template (overlay _parma2627h not drawn), number #000000 = template trim | away #ffcf00 from the club-infobox template (overlay _parma2627a not drawn), number #111111 = black/white for AA | third #000000 from the club-infobox template (overlay _parma2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ffffff', '#000000'),
      away: k('#ffcf00', '#111111'),
      third: k('#000000', '#f5f5f5'),
    },
  },
  {
    teamId: 488, // Sassuolo
    season: 2026,
    sourceName: 'Wikipedia: US Sassuolo Calcio (kit templates, rev 1387184126)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=US_Sassuolo_Calcio&oldid=1387184126',
    notes:
      'home #00a746 from the club-infobox template (overlay _sassuolo2627h not drawn), number #000000 = template trim | third #0044ff from the club-infobox template (overlay _sassuolo2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#00a746', '#000000'),
      third: k('#0044ff', '#f5f5f5'),
    },
  },
  {
    teamId: 494, // Udinese
    season: 2026,
    sourceName: 'Wikipedia: Udinese Calcio (kit templates, rev 1387109816)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Udinese_Calcio&oldid=1387109816',
    notes:
      'away #000066 from the club-infobox template (overlay _udinese2627A not drawn), number #f5f5f5 = black/white for AA | third #e5e7da from the club-infobox template (overlay _udinese2627t not drawn), number #111111 = black/white for AA',
    player: {
      away: k('#000066', '#f5f5f5'),
      third: k('#e5e7da', '#111111'),
    },
  },
  {
    teamId: 517, // Venezia
    season: 2026,
    sourceName: 'Wikipedia: Venezia FC (kit templates, rev 1387544935)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Venezia_FC&oldid=1387544935',
    notes:
      'home #000000 from the club-infobox template (overlay _venezia2627h not drawn), number #f5f5f5 = black/white for AA | away #ece3da from the club-infobox template (overlay _venezia2627a not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#000000', '#f5f5f5'),
      away: k('#ece3da', '#111111'),
    },
  },
];
