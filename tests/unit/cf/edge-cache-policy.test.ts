import { describe, expect, it } from 'vitest';
import {
  MATCH_TTL,
  PLAYER_TTL,
  edgeHtmlKind,
  edgeHtmlTtl,
  matchTtl,
  readMatchMarker,
} from '../../../cf/edge-cache-policy';

const NOW = 1_800_000_000;
const html = (status: string, ko: number) =>
  `<div class="mc x" data-edge-status="${status}" data-edge-ko="${ko}"><p>score</p></div>`;

describe('edgeHtmlKind', () => {
  it('matches locale-prefixed player and match pages only', () => {
    for (const l of ['en', 'fr', 'ar']) {
      expect(edgeHtmlKind(`/${l}/joueur/m-hitz-2`)).toBe('player');
      expect(edgeHtmlKind(`/${l}/match/levante-racing-santander-1570468`)).toBe('match');
    }
    expect(edgeHtmlKind('/joueur/m-hitz-2')).toBeNull(); // no locale prefix
    expect(edgeHtmlKind('/en/joueur')).toBeNull();
    expect(edgeHtmlKind('/en/equipe/raja-1')).toBeNull();
    expect(edgeHtmlKind('/api/v1/match/1')).toBeNull();
    expect(edgeHtmlKind('/en/match/a/b')).toBeNull();
  });
});

describe('matchTtl', () => {
  it('uses a short TTL while live, including half-time and extra time', () => {
    for (const s of ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'])
      expect(matchTtl(s, NOW - 3000, NOW)).toBe(MATCH_TTL.live);
  });
  it('is short just after the final whistle and long once settled', () => {
    for (const s of ['FT', 'AET', 'PEN']) {
      expect(matchTtl(s, NOW - 3 * 3600, NOW)).toBe(MATCH_TTL.finishedFresh);
      expect(matchTtl(s, NOW - 5 * 3600, NOW)).toBe(MATCH_TTL.finished);
    }
  });
  it('scales pre-match TTL with time to kick-off', () => {
    expect(matchTtl('NS', NOW + 86400, NOW)).toBe(MATCH_TTL.upcoming);
    expect(matchTtl('NS', NOW + 1800, NOW)).toBe(MATCH_TTL.soon);
    expect(matchTtl('NS', NOW - 600, NOW)).toBe(MATCH_TTL.kickoffWindow); // stale NS after kick-off
    expect(matchTtl('NS', NOW - 6 * 3600, NOW)).toBe(MATCH_TTL.finishedFresh);
  });
  it('keeps postponed/suspended short and refuses unknown input', () => {
    expect(matchTtl('PST', NOW + 86400, NOW)).toBe(MATCH_TTL.interrupted);
    expect(matchTtl('SUSP', NOW - 3600, NOW)).toBe(MATCH_TTL.interrupted);
    expect(matchTtl('', NOW, NOW)).toBe(0);
    expect(matchTtl('NS', Number.NaN, NOW)).toBe(0);
  });
});

describe('edgeHtmlTtl', () => {
  it('caches players for 10 minutes without reading the body', () => {
    expect(edgeHtmlTtl('player', null, NOW)).toBe(PLAYER_TTL);
    expect(PLAYER_TTL).toBe(600);
  });
  it('reads the match marker rendered by the page', () => {
    expect(readMatchMarker(html('2H', NOW))).toEqual({ status: '2H', ko: NOW });
    expect(edgeHtmlTtl('match', html('2H', NOW - 3000), NOW)).toBe(MATCH_TTL.live);
    expect(edgeHtmlTtl('match', html('FT', NOW - 86400), NOW)).toBe(MATCH_TTL.finished);
  });
  it('does not cache a match page without the marker', () => {
    expect(edgeHtmlTtl('match', '<html>no marker</html>', NOW)).toBe(0);
    expect(edgeHtmlTtl('match', null, NOW)).toBe(0);
  });
});
