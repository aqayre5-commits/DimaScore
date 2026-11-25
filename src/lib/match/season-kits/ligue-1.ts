/**
 * Ligue 1 2026/27 season kits (API-Football competition 61). Generated from cited Wikipedia kit
 * templates on 2026-11-25; see ./README.md for the sourcing rules. Flat primaries only: stripes,
 * hoops, sleeve colours and trim in the source overlay are noted per entry but never drawn.
 * Slots that could not be confirmed for 2026/27 are left out (see ./coverage.ts).
 */
import type { SeasonKitSet } from '../season-kits';
import { k } from './helpers';

export const LIGUE_1_KITS: readonly SeasonKitSet[] = [
  {
    teamId: 85, // Paris Saint Germain
    season: 2026,
    sourceName: 'Wikipedia: 2026–27 Paris Saint-Germain FC season (kit templates, rev 1387432244)',
    sourceUrl:
      'https://en.wikipedia.org/w/index.php?title=2026%E2%80%9327_Paris_Saint-Germain_FC_season&oldid=1387432244',
    notes:
      'home #0000cc from the season-page template (overlay _psg2627h not drawn), number #f5f5f5 = black/white for AA | away #ffffff from the season-page template (overlay _psg2627a not drawn), number #111111 = black/white for AA | third #111111 from the club-infobox template (overlay _psg2627t not drawn), number #f5f5f5 = black/white for AA | infobox slots cite https://en.wikipedia.org/w/index.php?title=Paris_Saint-Germain_FC&oldid=1387432815',
    player: {
      home: k('#0000cc', '#f5f5f5'),
      away: k('#ffffff', '#111111'),
      third: k('#111111', '#f5f5f5'),
    },
  },
  {
    teamId: 114, // Paris FC
    season: 2026,
    sourceName: 'Wikipedia: Paris FC (kit templates, rev 1387370568)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Paris_FC&oldid=1387370568',
    notes:
      'home #000060 from the club-infobox template (overlay _parisfc2627h not drawn), number #f5f5f5 = black/white for AA | away #ffffff from the club-infobox template (overlay _parisfc2627a not drawn), number #16234e = template trim',
    player: {
      home: k('#000060', '#f5f5f5'),
      away: k('#ffffff', '#16234e'),
    },
  },
  {
    teamId: 79, // Lille
    season: 2026,
    sourceName: 'Wikipedia: Lille OSC (kit templates, rev 1386706600)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Lille_OSC&oldid=1386706600',
    notes:
      'home #fe0000 from the club-infobox template (overlay _lille2627h not drawn), number #111111 = black/white for AA | away #ffffff from the club-infobox template (overlay _lille2627a not drawn), number #111111 = black/white for AA | third #191970 from the club-infobox template (overlay _lille2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#fe0000', '#111111'),
      away: k('#ffffff', '#111111'),
      third: k('#191970', '#f5f5f5'),
    },
  },
  {
    teamId: 80, // Lyon
    season: 2026,
    sourceName: 'Wikipedia: Olympique Lyonnais (kit templates, rev 1384819447)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Olympique_Lyonnais&oldid=1384819447',
    notes:
      'home #ffffff from the club-infobox template (overlay _lyon2627h not drawn; sleeves #0000ff not drawn), number #0000ff = template trim | away #f35764 from the club-infobox template (overlay _lyon2627a not drawn), number #111111 = black/white for AA | third #000000 from the club-infobox template (overlay _lyon2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ffffff', '#0000ff'),
      away: k('#f35764', '#111111'),
      third: k('#000000', '#f5f5f5'),
    },
  },
  {
    teamId: 81, // Marseille
    season: 2026,
    sourceName: 'Wikipedia: Olympique de Marseille (kit templates, rev 1387163725)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Olympique_de_Marseille&oldid=1387163725',
    notes:
      'home #ffffff from the club-infobox template (overlay _marseille2627h not drawn), number #111111 = black/white for AA | away #2c2c3e from the club-infobox template (overlay _marseille2627a not drawn), number #f5f5f5 = black/white for AA | third #aebbed from the club-infobox template (overlay _marseille2627t not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#ffffff', '#111111'),
      away: k('#2c2c3e', '#f5f5f5'),
      third: k('#aebbed', '#111111'),
    },
  },
  {
    teamId: 106, // Stade Brestois 29
    season: 2026,
    sourceName: 'Wikipedia: Stade Brestois 29 (kit templates, rev 1387260863)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Stade_Brestois_29&oldid=1387260863',
    notes:
      'home #ef0000 from the club-infobox template (overlay _brest2627h not drawn), number #000000 = black/white for AA | third #000055 from the club-infobox template (overlay _brest2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ef0000', '#000000'),
      third: k('#000055', '#f5f5f5'),
    },
  },
  {
    teamId: 84, // Nice
    season: 2026,
    sourceName: 'Wikipedia: OGC Nice (kit templates, rev 1383445272)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=OGC_Nice&oldid=1383445272',
    notes:
      'home #ff0000 from the club-infobox template (overlay _nice2627h not drawn), number #000000 = template trim | away #ffffff from the club-infobox template (overlay _nice2627a not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#ff0000', '#000000'),
      away: k('#ffffff', '#111111'),
    },
  },
  {
    teamId: 91, // Monaco
    season: 2026,
    sourceName: 'Wikipedia: AS Monaco FC (kit templates, rev 1384303490)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=AS_Monaco_FC&oldid=1384303490',
    notes:
      'home #fe0000 from the club-infobox template (overlay _monaco2627h not drawn; sleeves #ffffff not drawn), number #111111 = black/white for AA | away #542d34 from the club-infobox template (overlay _monaco2627a not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#fe0000', '#111111'),
      away: k('#542d34', '#f5f5f5'),
    },
  },
  {
    teamId: 94, // Rennes
    season: 2026,
    sourceName: 'Wikipedia: Stade Rennais FC (kit templates, rev 1382144991)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Stade_Rennais_FC&oldid=1382144991',
    notes:
      'home #ff0000 from the club-infobox template (overlay _rennes2627h not drawn), number #000000 = template trim | away #ffffff from the club-infobox template (overlay _rennes2627a not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#ff0000', '#000000'),
      away: k('#ffffff', '#111111'),
    },
  },
  {
    teamId: 97, // Lorient
    season: 2026,
    sourceName: 'Wikipedia: FC Lorient (kit templates, rev 1382369539)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=FC_Lorient&oldid=1382369539',
    notes:
      'away #fffae4 from the club-infobox template (overlay _lorient2627a not drawn), number #111111 = black/white for AA | third #000033 from the club-infobox template (overlay _lorient2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      away: k('#fffae4', '#111111'),
      third: k('#000033', '#f5f5f5'),
    },
  },
  {
    teamId: 96, // Toulouse
    season: 2026,
    sourceName: 'Wikipedia: Toulouse FC (kit templates, rev 1384012119)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Toulouse_FC&oldid=1384012119',
    notes:
      'home #3c0082 from the club-infobox template (overlay _toulouse2627h not drawn), number #f5f5f5 = black/white for AA | away #ffffff from the club-infobox template (overlay _toulouse2627a not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#3c0082', '#f5f5f5'),
      away: k('#ffffff', '#111111'),
    },
  },
  {
    teamId: 1298, // Le Mans
    season: 2026,
    sourceName: 'Wikipedia: Le Mans FC (kit templates, rev 1376910711)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Le_Mans_FC&oldid=1376910711',
    notes:
      'home #ff0000 from the club-infobox template (overlay _lemans2627h not drawn; sleeves #ffff00 not drawn), number #111111 = black/white for AA | away #ffff00 from the club-infobox template (overlay _lemans2627a not drawn), number #111111 = black/white for AA | third #00514b from the club-infobox template (overlay _lemans2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#ff0000', '#111111'),
      away: k('#ffff00', '#111111'),
      third: k('#00514b', '#f5f5f5'),
    },
  },
  {
    teamId: 108, // Auxerre
    season: 2026,
    sourceName: 'Wikipedia: AJ Auxerre (kit templates, rev 1387681212)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=AJ_Auxerre&oldid=1387681212',
    notes:
      'home #ffffff from the club-infobox template (overlay _AJAuxerre2627h not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#ffffff', '#111111'),
    },
  },
  {
    teamId: 95, // Strasbourg
    season: 2026,
    sourceName: 'Wikipedia: RC Strasbourg Alsace (kit templates, rev 1386667033)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=RC_Strasbourg_Alsace&oldid=1386667033',
    notes:
      'home #0000dd from the club-infobox template (overlay _strasbourg2627h not drawn), number #ffffff = template trim | away #faf7f0 from the club-infobox template (overlay _strasbourg2627a not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#0000dd', '#ffffff'),
      away: k('#faf7f0', '#111111'),
    },
  },
  {
    teamId: 77, // Angers
    season: 2026,
    sourceName: 'Wikipedia: Angers SCO (kit templates, rev 1384982411)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Angers_SCO&oldid=1384982411',
    notes:
      'home #000000 from the club-infobox template (overlay _angers2627h not drawn), number #f5f5f5 = black/white for AA | away #ffffff from the club-infobox template (overlay _angers2627a not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#000000', '#f5f5f5'),
      away: k('#ffffff', '#111111'),
    },
  },
  {
    teamId: 111, // Le Havre
    season: 2026,
    sourceName: 'Wikipedia: Le Havre AC (kit templates, rev 1386346572)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Le_Havre_AC&oldid=1386346572',
    notes:
      'home #8ed6f9 from the club-infobox template (overlay _lehavre2627h not drawn; sleeves #0d2142 not drawn), number #0d2142 = template trim | away #f0f7ef from the club-infobox template (overlay _lehavre2627a not drawn), number #111111 = black/white for AA | third #2e2427 from the club-infobox template (overlay _lehavre2627t not drawn), number #f5f5f5 = black/white for AA',
    player: {
      home: k('#8ed6f9', '#0d2142'),
      away: k('#f0f7ef', '#111111'),
      third: k('#2e2427', '#f5f5f5'),
    },
  },
];
