import { describe, expect, it } from 'vitest';
import {
  contrastNumber,
  isGoalkeeperPos,
  kitsForTeam,
  kitsNeedRefresh,
  parseHex,
  resolveRolePalette,
  resolveTeamKits,
  type KitCorrectionMap,
  type TeamKits,
} from '@/lib/match/kit-colours';

const KOVAR = { fixtureId: 1635715, teamId: 197, role: 'goalkeeper' as const };
const MADRID = { fixtureId: 1635715, teamId: 541, role: 'player' as const };

describe('parseHex', () => {
  it('adds a hash to a 6-digit value and lowercases it', () => {
    expect(parseHex('FFFFFF')).toBe('#ffffff');
    expect(parseHex('#1A2B3C')).toBe('#1a2b3c');
  });
  it('rejects empty, short, or non-hex values', () => {
    expect(parseHex(null)).toBeNull();
    expect(parseHex('')).toBeNull();
    expect(parseHex('fff')).toBeNull();
    expect(parseHex('#fffffg')).toBeNull();
  });
});

describe('isGoalkeeperPos', () => {
  it('is decided by position and never by shirt number', () => {
    expect(isGoalkeeperPos('G')).toBe(true);
    expect(isGoalkeeperPos('gk')).toBe(true);
    expect(isGoalkeeperPos('Goalkeeper')).toBe(true);
    expect(isGoalkeeperPos('D')).toBe(false);
    expect(isGoalkeeperPos('F')).toBe(false);
    expect(isGoalkeeperPos(null)).toBe(false);
    // Kovář wears 32 — the number must not be consulted
    expect(isGoalkeeperPos('32')).toBe(false);
  });
});

describe('contrastNumber', () => {
  it('picks black on a light shirt and white on a dark shirt', () => {
    expect(contrastNumber('#ffffff')).toBe('#111111');
    expect(contrastNumber('#f5f5f5')).toBe('#111111');
    expect(contrastNumber('#111111')).toBe('#f5f5f5');
    expect(contrastNumber('#1a1a1a')).toBe('#f5f5f5');
  });
});

describe('resolveRolePalette', () => {
  it('uses the API palette when it is complete', () => {
    const p = resolveRolePalette({
      ...MADRID,
      api: { primary: 'ffffff', number: '1a1a1a', border: '1a1a1a' },
    });
    expect(p).toMatchObject({
      primary: '#ffffff',
      number: '#1a1a1a',
      border: '#1a1a1a',
      source: 'api',
    });
  });

  it('falls back to a neutral shirt when primary is missing and no worn season kit is known', () => {
    const p = resolveRolePalette({
      ...MADRID,
      api: { primary: null, number: 'ff0000', border: '00ff00' },
    });
    expect(p.source).toBe('neutral');
    expect(p.primary).toBe('#c8cdd1');
    // number/border from the API are still used when present
    expect(p.number).toBe('#ff0000');
    expect(p.border).toBe('#00ff00');
  });

  it('uses a season kit only when primary is missing and the worn kit is known', () => {
    const season = { primary: '#6cabdd', number: '#1c2c5b', border: '#1c2c5b' };
    const p = resolveRolePalette({
      fixtureId: 1,
      teamId: 50,
      role: 'player',
      api: { primary: null, number: null, border: null },
      seasonKit: season,
    });
    expect(p).toMatchObject({ ...season, source: 'season' });
  });

  it('keeps the shirt colour and picks a contrasting number when only the number is missing', () => {
    const light = resolveRolePalette({
      ...MADRID,
      api: { primary: 'ffffff', number: null, border: '1a1a1a' },
    });
    expect(light.primary).toBe('#ffffff');
    expect(light.number).toBe('#111111');
    expect(light.border).toBe('#1a1a1a');
    expect(light.source).toBe('api');

    const dark = resolveRolePalette({
      ...KOVAR,
      api: { primary: '111111', number: null, border: null },
    });
    expect(dark.primary).toBe('#111111');
    expect(dark.number).toBe('#f5f5f5');
    expect(dark.border).toBe('#f5f5f5');
  });

  it('lets a verified fixture correction override the API', () => {
    const p = resolveRolePalette({
      ...MADRID,
      api: { primary: 'ff0000', number: '00ff00', border: '0000ff' },
      correction: { primary: 'ffffff', number: '1a1a1a' },
    });
    expect(p).toMatchObject({
      primary: '#ffffff',
      number: '#1a1a1a',
      border: '#0000ff', // border not in the correction, falls through to the API
      source: 'correction',
    });
  });
});

describe('team.id matching with swapped order', () => {
  const apiByTeam: Record<number, unknown> = {
    541: {
      player: { primary: 'ffffff', number: '1a1a1a', border: '1a1a1a' },
      goalkeeper: { primary: '1a1a1a', number: 'ffffff', border: 'ffffff' },
    },
    197: {
      player: { primary: '111111', number: 'f5f5f5', border: 'f5f5f5' },
      goalkeeper: { primary: 'ffcc64', number: '282622', border: '584334' },
    },
  };

  it('binds palettes to team.id even when the API lists the away team first', () => {
    const order = [197, 541]; // PSV first, then Real Madrid (as the live feed did)
    const kits = order.map((id) => resolveTeamKits(1635715, id, apiByTeam[id]));
    expect(kits.map((k) => k.teamId)).toEqual([197, 541]);
    expect(kitsForTeam(kits, 541)?.player.primary).toBe('#ffffff');
    expect(kitsForTeam(kits, 197)?.player.primary).toBe('#111111');
    expect(kitsForTeam(kits, 197)?.goalkeeper.primary).toBe('#ffcc64');
    expect(kitsForTeam(kits, 50)).toBeUndefined();
  });

  it('still matches after the array is reversed (home/away or RTL card order)', () => {
    const kits = [541, 197].map((id) => resolveTeamKits(1635715, id, apiByTeam[id]));
    const flipped = [...kits].reverse();
    expect(kitsForTeam(flipped, 541)?.player.primary).toBe('#ffffff');
    expect(kitsForTeam(flipped, 197)?.player.primary).toBe('#111111');
  });
});

describe('correction precedence end-to-end', () => {
  it('applies a correction for one team and leaves the other on the API', () => {
    const corrections: KitCorrectionMap = {
      '1635715:197': { player: { primary: '222244' } },
    };
    const psv = resolveTeamKits(
      1635715,
      197,
      { player: { primary: '111111', number: 'ffffff', border: 'ffffff' } },
      { corrections },
    );
    const rma = resolveTeamKits(
      1635715,
      541,
      { player: { primary: 'ffffff', number: '1a1a1a', border: '1a1a1a' } },
      { corrections },
    );
    expect(psv.player.primary).toBe('#222244');
    expect(psv.player.source).toBe('correction');
    expect(rma.player.primary).toBe('#ffffff');
    expect(rma.player.source).toBe('api');
  });
});

describe('kitsNeedRefresh', () => {
  const ready = (over: Partial<TeamKits> = {}): TeamKits =>
    ({
      teamId: 1,
      player: { primary: '#fff', number: '#000', border: '#000', source: 'api' },
      goalkeeper: { primary: '#ff0', number: '#000', border: '#000', source: 'api' },
      ...over,
    }) as TeamKits;

  it('is true when nothing is stored or a role is only a fallback', () => {
    expect(kitsNeedRefresh(null)).toBe(true);
    expect(kitsNeedRefresh(undefined)).toBe(true);
    expect(kitsNeedRefresh(ready())).toBe(false);
    expect(
      kitsNeedRefresh(
        ready({
          player: { primary: '#c8cdd1', number: '#1a1a1a', border: '#4a4f54', source: 'neutral' },
        }),
      ),
    ).toBe(true);
  });
});
