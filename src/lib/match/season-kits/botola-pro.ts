/**
 * Botola Pro 2026/27 season kits (API-Football competition 200). Generated from cited Wikipedia kit
 * templates on 2026-11-25; see ./README.md for the sourcing rules. Flat primaries only: stripes,
 * hoops, sleeve colours and trim in the source overlay are noted per entry but never drawn.
 * Slots that could not be confirmed for 2026/27 are left out (see ./coverage.ts).
 */
import type { SeasonKitSet } from '../season-kits';
import { k } from './helpers';

export const BOTOLA_PRO_KITS: readonly SeasonKitSet[] = [
  {
    teamId: 969, // FAR Rabat
    season: 2026,
    sourceName: 'Wikipedia: AS FAR (kit templates, rev 1381330243)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=AS_FAR&oldid=1381330243',
    notes:
      'home #000000 from the club-infobox template (overlay _asfar2627h not drawn), number #f5f5f5 = black/white for AA | away #ffffff from the club-infobox template (overlay _asfar2627a not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#000000', '#f5f5f5'),
      away: k('#ffffff', '#111111'),
    },
  },
  {
    teamId: 968, // Wydad AC
    season: 2026,
    sourceName: 'Wikipedia: Wydad AC (kit templates, rev 1387122412)',
    sourceUrl: 'https://en.wikipedia.org/w/index.php?title=Wydad_AC&oldid=1387122412',
    notes:
      'home #ff0000 from the club-infobox template (overlay _wydad2627h not drawn), number #111111 = black/white for AA | away #ffffff from the club-infobox template (overlay _wydad2627a not drawn), number #111111 = black/white for AA',
    player: {
      home: k('#ff0000', '#111111'),
      away: k('#ffffff', '#111111'),
    },
  },
  {
    teamId: 974, // Ittihad Tanger
    season: 2026,
    sourceName: 'Wikipedia: 2026–27 IR Tanger season (kit templates, rev 1387392223)',
    sourceUrl:
      'https://en.wikipedia.org/w/index.php?title=2026%E2%80%9327_IR_Tanger_season&oldid=1387392223',
    notes:
      'away #ffef00 from the season-page template (overlay _collar not drawn), number #111111 = black/white for AA',
    player: {
      away: k('#ffef00', '#111111'),
    },
  },
];
