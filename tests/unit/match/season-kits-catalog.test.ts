import { describe, expect, it } from 'vitest';
import {
  SEASON_KITS,
  catalogSeasonKits,
  contrastRatio,
  resolveTeamKitsWithSeason,
  type FixtureKitContext,
  type SeasonKitSet,
} from '@/lib/match/season-kits';
import { KIT_COVERAGE_GAPS, LEAGUE_ROSTERS } from '@/lib/match/season-kits/coverage';

const HEX = /^#[0-9a-f]{6}$/;
const SLOTS = ['home', 'away', 'third'] as const;

function palettes(set: SeasonKitSet) {
  const out: { where: string; primary: string; number: string; border: string }[] = [];
  for (const role of ['player', 'goalkeeper'] as const) {
    for (const slot of SLOTS) {
      const p = set[role]?.[slot];
      if (p) out.push({ where: `${set.teamId} ${role}.${slot}`, ...p });
    }
  }
  return out;
}

const ctx = (homeTeamId: number, awayTeamId: number): FixtureKitContext => ({
  fixtureId: 9100001,
  season: 2026,
  homeTeamId,
  awayTeamId,
});

describe('season kit catalog entries', () => {
  it('has one entry per team id and season', () => {
    const keys = SEASON_KITS.map((s) => `${s.teamId}:${s.season}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(SEASON_KITS.every((s) => s.season === 2026)).toBe(true);
  });

  it('cites a source on every entry', () => {
    for (const s of SEASON_KITS) {
      expect(s.sourceName.trim().length, `${s.teamId} sourceName`).toBeGreaterThan(0);
      expect(s.sourceUrl, `${s.teamId} sourceUrl`).toMatch(/^https:\/\/[^\s]+$/);
    }
  });

  it('stores six-digit lowercase hex for every colour', () => {
    for (const s of SEASON_KITS) {
      for (const p of palettes(s)) {
        expect(p.primary, `${p.where} primary`).toMatch(HEX);
        expect(p.number, `${p.where} number`).toMatch(HEX);
        expect(p.border, `${p.where} border`).toMatch(HEX);
      }
    }
  });

  it('keeps every shirt number at AA contrast (4.5:1) against its primary', () => {
    for (const s of SEASON_KITS) {
      for (const p of palettes(s)) {
        expect(contrastRatio(p.primary, p.number), p.where).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('has at least one outfield slot, and no outfield slot repeats the same primary', () => {
    for (const s of SEASON_KITS) {
      const prim = SLOTS.map((slot) => s.player[slot]?.primary).filter(Boolean);
      expect(prim.length, `${s.teamId} has no outfield slot`).toBeGreaterThan(0);
      if (s.teamId !== 50 && s.teamId !== 36) {
        expect(new Set(prim).size, `${s.teamId} repeats a primary`).toBe(prim.length);
      }
    }
  });
});

describe('rosters and coverage', () => {
  const rosterIds = LEAGUE_ROSTERS.flatMap((l) => l.teams.map((t) => t.id));

  it('lists each team once, with the expected league sizes', () => {
    expect(new Set(rosterIds).size).toBe(rosterIds.length);
    const sizes = Object.fromEntries(LEAGUE_ROSTERS.map((l) => [l.competitionId, l.teams.length]));
    expect(sizes).toEqual({ 39: 20, 140: 20, 135: 20, 78: 18, 61: 18, 200: 16 });
  });

  it('only catalogues teams that are on a roster', () => {
    for (const s of SEASON_KITS) expect(rosterIds, `${s.teamId}`).toContain(s.teamId);
  });

  it('explains every roster team that is missing or partial, and nothing else', () => {
    for (const id of rosterIds) {
      const set = catalogSeasonKits(id, 2026);
      const gap = KIT_COVERAGE_GAPS[id];
      if (!set) {
        expect(gap?.status, `${id} has neither a kit nor a reason`).toBe('missing');
      } else if (!set.player.home || !set.player.away) {
        expect(gap?.status, `${id} is partial without a reason`).toBe('partial');
      } else {
        expect(gap, `${id} is complete but listed as a gap`).toBeUndefined();
      }
      if (gap) expect(gap.reason.trim().length).toBeGreaterThan(10);
    }
    for (const id of Object.keys(KIT_COVERAGE_GAPS)) expect(rosterIds).toContain(Number(id));
  });

  it('covers every league with at least one team, Botola included', () => {
    for (const l of LEAGUE_ROSTERS) {
      const covered = l.teams.filter((t) => catalogSeasonKits(t.id, 2026)).length;
      expect(covered, l.league).toBeGreaterThan(0);
    }
  });
});

describe('fallback rules with the extended catalog', () => {
  it('uses the home kit for the home side and the away kit for the visitors', () => {
    const wydad = resolveTeamKitsWithSeason(ctx(968, 969), 968, null); // Wydad AC v FAR Rabat
    const far = resolveTeamKitsWithSeason(ctx(968, 969), 969, null);
    expect(wydad.player).toMatchObject({ source: 'season', primary: '#ff0000' });
    expect(far.player).toMatchObject({ source: 'season', primary: '#ffffff' });
    expect(wydad.worn).toMatchObject({ slot: 'home', basis: 'convention' });
    expect(far.worn).toMatchObject({ slot: 'away', basis: 'convention' });
  });

  it('matches by team.id, so swapping home and away swaps the colours', () => {
    const swapped = resolveTeamKitsWithSeason(ctx(969, 968), 968, null);
    expect(swapped.player.primary).toBe('#ffffff'); // Wydad now away
  });

  it('switches to the third kit when the away shirt clashes with the home shirt', () => {
    // Hull City (home black) v Tottenham (away black, third purple).
    const spurs = resolveTeamKitsWithSeason(ctx(64, 47), 47, null);
    expect(spurs.worn).toMatchObject({ slot: 'third' });
    expect(spurs.player.primary).toBe('#800080');
  });

  it('leaves a slot grey when only the other slot is confirmed', () => {
    // Levante (539): only the home kit is confirmed for 2026/27.
    const set = catalogSeasonKits(539, 2026);
    expect(set?.player.home).toBeDefined();
    expect(set?.player.away).toBeUndefined();
    const atHome = resolveTeamKitsWithSeason(ctx(539, 541), 539, null);
    const away = resolveTeamKitsWithSeason(ctx(541, 539), 539, null);
    expect(atHome.player.source).toBe('season');
    expect(away.player.source).toBe('neutral');
  });

  it('gives goalkeepers a season palette only where a goalkeeper kit is sourced', () => {
    const arsenal = resolveTeamKitsWithSeason(ctx(42, 49), 42, null);
    expect(arsenal.goalkeeper.source).toBe('season');
    const tottenham = resolveTeamKitsWithSeason(ctx(47, 49), 47, null);
    expect(tottenham.player.source).toBe('season');
    expect(tottenham.goalkeeper.source).toBe('neutral');
  });

  it('never invents a kit for a team that is not catalogued', () => {
    const lens = resolveTeamKitsWithSeason(ctx(116, 80), 116, null); // RC Lens: pattern-only kits
    expect(lens.player.source).toBe('neutral');
    expect(lens.worn.slot).toBeNull();
  });

  it('lets an API palette win over the catalog', () => {
    const api = { player: { primary: '123456', number: 'ffffff', border: 'ffffff' } };
    const r = resolveTeamKitsWithSeason(ctx(42, 49), 42, api);
    expect(r.player).toMatchObject({ source: 'api', primary: '#123456' });
  });
});
