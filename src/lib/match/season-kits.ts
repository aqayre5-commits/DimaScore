/**
 * Season kit catalog and worn-kit choice for the line-ups pitch.
 *
 * Palettes are used only when it is known (or, under a clearly labelled
 * convention, assumed) which kit — home, away, or third — was worn. A
 * missing API-Football fixture palette is not enough on its own.
 *
 * Worn-kit basis is one of:
 *   - verified: a per-fixture slot in KIT_WORN_SLOTS, or a colour correction
 *   - convention: home team wears home; away team wears away; if the away
 *     shirt clashes with the home team's worn shirt and a third kit is
 *     catalogued, the away team wears third
 *   - unknown: no catalog or inferred slot for this team/season — stay grey
 *
 * The convention is not verified match data. It is kept as a separate basis
 * so it can be judged independently of sourced palettes.
 *
 * Shirt drawing rules still apply: one flat primary (no stripes, hoops,
 * gradients, sashes or checkerboards are invented), numbers are contrast-safe,
 * goalkeepers are chosen by position, matching is by team.id.
 */

import {
  contrastNumber,
  kitsNeedRefresh,
  luminance,
  parseHex,
  resolveTeamKits,
  type KitCorrectionMap,
  type KitPalette,
  type StoredTeamKits,
  type TeamKits,
} from './kit-colours';
import { KIT_CORRECTIONS } from './kit-corrections';

export type KitSlot = 'home' | 'away' | 'third';
export type WornKitBasis = 'verified' | 'convention' | 'unknown';

export interface WornKitDecision {
  slot: KitSlot | null;
  basis: WornKitBasis;
  reason: string;
}

export interface SeasonRoleKits {
  home: KitPalette;
  away: KitPalette;
  third?: KitPalette;
}

export interface SeasonKitSet {
  teamId: number;
  /** Competition season year (2026 = 2026/27). */
  season: number;
  sourceName: string;
  sourceUrl: string;
  notes?: string;
  player: SeasonRoleKits;
  goalkeeper: SeasonRoleKits;
}

/** Verified worn-kit slot, keyed by `${fixtureId}:${teamId}`. Empty unless confirmed. */
export const KIT_WORN_SLOTS: Record<string, KitSlot> = {};

export function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Two shirt bodies clash when their contrast is below this ratio (similar lightness). */
export const KIT_CLASH_RATIO = 2;

export function shirtsClash(a: string, b: string): boolean {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return false;
  return contrastRatio(pa, pb) < KIT_CLASH_RATIO;
}

/**
 * Pick black or white for the number, whichever actually meets (or is closer
 * to) 4.5:1 against the shirt. The generic 0.55 luminance cut can pick the
 * weaker option on mid-tone shirts.
 */
export function contrastSafeNumber(primary: string): string {
  const p = parseHex(primary);
  if (!p) return contrastNumber('#c8cdd1');
  const dark = '#111111';
  const light = '#f5f5f5';
  return contrastRatio(p, dark) >= contrastRatio(p, light) ? dark : light;
}

function palette(primary: string, number?: string, border?: string): KitPalette {
  const p = parseHex(primary) ?? primary;
  const n = parseHex(number ?? '') ?? contrastSafeNumber(p);
  const b = parseHex(border ?? '') ?? n;
  return { primary: p, number: n, border: b };
}

/**
 * Curated 2026/27 kits, cited per entry. Flat primaries only — patterns
 * described in the notes are not drawn.
 */
export const SEASON_KITS: readonly SeasonKitSet[] = [
  {
    teamId: 50, // Manchester City
    season: 2026,
    sourceName: 'Wikipedia kit template + official PUMA / club kit pages',
    sourceUrl: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Manchester_City_F.C._season',
    notes:
      'Home shirt is a sky-blue gradient (official “Team Light Blue-Icy Blue”); away has a bee motif; third is white with a two-tone sash. The pitch drawing is a single flat primary. Number/border on home and away come from the same Wikipedia template (sock navy #1C214F, flaxen #FCCD10). One GK palette is curated (official Vibrant Green–Varsity Green, centre-crop sample of the PUMA product photo); orange and pink GK shirts exist but are not assigned to a slot.',
    player: {
      home: palette('#98c6eb', '#1c214f', '#1c214f'),
      away: palette('#000000', '#fccd10', '#fccd10'),
      // Official PUMA White-Blazing Blue; Wikipedia third body is empty (pattern only).
      third: palette('#ffffff', '#111111', '#111111'),
    },
    goalkeeper: {
      // Sampled from official PUMA product image, centre crop, near-white excluded, avg #3c9d82.
      // Dark number (#111111) is 5.7:1 — contrastNumber would have picked white (3.0:1, below AA).
      home: palette('#3c9d82', '#111111', '#111111'),
      away: palette('#3c9d82', '#111111', '#111111'),
      third: palette('#3c9d82', '#111111', '#111111'),
    },
  },
  {
    teamId: 36, // Fulham
    season: 2026,
    sourceName: 'Wikipedia season infobox + official Fulham shop',
    sourceUrl: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Fulham_F.C._season',
    notes:
      'Home has a woven river pattern that is not drawn. Away is an official Black/Red checkerboard (Wikipedia body2 is empty because of the pattern); the stored primary is black, with red number/border from the same infobox socks (#FF0000). Third is official Blue/Pink (Wikipedia body3 #ADD8E6); pink bands are not drawn. Away GK was not confirmed on the official shop, so the home GK palette is reused.',
    player: {
      home: palette('#ffffff', '#000000', '#000000'),
      away: palette('#000000', '#ff0000', '#ff0000'),
      third: palette('#add8e6', '#111111', '#111111'),
    },
    goalkeeper: {
      // Official shop colour “Blue”; sampled from https://shop.fulhamfc.com/siteimg/prodhires/6934-386.jpg
      home: palette('#48a8f0', '#111111', '#111111'),
      away: palette('#48a8f0', '#111111', '#111111'),
      // Official shop colour “Green”; sampled from https://shop.fulhamfc.com/siteimg/prodhires/6977-410.jpg
      third: palette('#63e693', '#111111', '#111111'),
    },
  },
];

const catalogByTeamSeason = new Map<string, SeasonKitSet>();
for (const row of SEASON_KITS) {
  catalogByTeamSeason.set(`${row.teamId}:${row.season}`, row);
}

export function catalogSeasonKits(teamId: number, season: number): SeasonKitSet | undefined {
  return catalogByTeamSeason.get(`${teamId}:${season}`);
}

export function wornSlotKey(fixtureId: number, teamId: number) {
  return `${fixtureId}:${teamId}`;
}

export function pickWornSlot(opts: {
  fixtureId: number;
  teamId: number;
  isHome: boolean;
  kits: SeasonRoleKits | null | undefined;
  /** Already-chosen opponent outfield primary, if known. */
  opponentPrimary?: string | null;
}): WornKitDecision {
  const verified = KIT_WORN_SLOTS[wornSlotKey(opts.fixtureId, opts.teamId)];
  if (verified) {
    if (opts.kits && slotPalette(opts.kits, verified)) {
      return { slot: verified, basis: 'verified', reason: `KIT_WORN_SLOTS=${verified}` };
    }
    return {
      slot: null,
      basis: 'unknown',
      reason: `verified slot ${verified} has no palette`,
    };
  }
  if (!opts.kits) {
    return { slot: null, basis: 'unknown', reason: 'no season kit for this team/season' };
  }
  if (opts.isHome) {
    return { slot: 'home', basis: 'convention', reason: 'home team wears home kit (convention)' };
  }
  const away = opts.kits.away;
  const third = opts.kits.third;
  if (
    opts.opponentPrimary &&
    away &&
    third &&
    shirtsClash(away.primary, opts.opponentPrimary)
  ) {
    return {
      slot: 'third',
      basis: 'convention',
      reason: 'away kit clashes with the home shirt; third kit worn (convention)',
    };
  }
  return { slot: 'away', basis: 'convention', reason: 'away team wears away kit (convention)' };
}

export function slotPalette(kits: SeasonRoleKits, slot: KitSlot): KitPalette | null {
  return kits[slot] ?? null;
}

export interface ApiKitSample {
  teamId: number;
  isHome: boolean;
  player: KitPalette | null;
  goalkeeper: KitPalette | null;
}

/**
 * Build home/away (and a third, if a third distinct primary appears) from
 * this team's own API palettes in other fixtures of the same season.
 * Home slot = most common player primary when the team was at home;
 * away slot = most common when away, if it differs.
 */
export function inferSeasonKitsFromApiSamples(
  teamId: number,
  season: number,
  samples: readonly ApiKitSample[],
): SeasonKitSet | null {
  const mine = samples.filter((s) => s.teamId === teamId && s.player && parseHex(s.player.primary));
  if (mine.length === 0) return null;

  const mode = (rows: ApiKitSample[], role: 'player' | 'goalkeeper'): KitPalette | null => {
    const counts = new Map<string, { n: number; pal: KitPalette }>();
    for (const r of rows) {
      const pal = r[role];
      const p = pal && parseHex(pal.primary);
      if (!p) continue;
      const cur = counts.get(p);
      if (cur) cur.n += 1;
      else counts.set(p, { n: 1, pal: { primary: p, number: pal!.number, border: pal!.border } });
    }
    let best: { n: number; pal: KitPalette } | null = null;
    for (const v of counts.values()) {
      if (!best || v.n > best.n) best = v;
    }
    return best?.pal ?? null;
  };

  const atHome = mine.filter((s) => s.isHome);
  const atAway = mine.filter((s) => !s.isHome);
  const homeP = mode(atHome, 'player') ?? mode(mine, 'player');
  if (!homeP) return null;
  const awayP = mode(atAway, 'player');
  const thirdP =
    awayP && awayP.primary !== homeP.primary
      ? mine
          .map((s) => s.player)
          .find((p) => p && parseHex(p.primary) && p.primary !== homeP.primary && p.primary !== awayP.primary) ??
        undefined
      : undefined;

  const homeGk = mode(atHome, 'goalkeeper') ?? mode(mine, 'goalkeeper');
  const awayGk = mode(atAway, 'goalkeeper') ?? homeGk;

  return {
    teamId,
    season,
    sourceName: 'Inferred from this team’s API-Football palettes in other fixtures of the same season',
    sourceUrl: '',
    notes: 'Colours are verified-from-API; the worn slot for a fixture without colours still uses the convention unless KIT_WORN_SLOTS has a row.',
    player: {
      home: homeP,
      away: awayP && awayP.primary !== homeP.primary ? awayP : homeP,
      third: thirdP && parseHex(thirdP.primary) ? thirdP : undefined,
    },
    goalkeeper: {
      home: homeGk ?? homeP,
      away: awayGk ?? homeGk ?? homeP,
    },
  };
}

/** Catalog first; fill missing slots from same-season API inference. */
export function mergeSeasonKits(
  catalog: SeasonKitSet | undefined,
  inferred: SeasonKitSet | null | undefined,
): SeasonKitSet | null {
  if (catalog && !inferred) return catalog;
  if (!catalog && inferred) return inferred;
  if (!catalog || !inferred) return null;
  return {
    ...catalog,
    player: {
      home: catalog.player.home,
      away: catalog.player.away,
      third: catalog.player.third ?? inferred.player.third,
    },
    goalkeeper: {
      home: catalog.goalkeeper.home,
      away: catalog.goalkeeper.away ?? inferred.goalkeeper.away,
      third: catalog.goalkeeper.third ?? inferred.goalkeeper.third,
    },
  };
}

export interface FixtureKitContext {
  fixtureId: number;
  season: number;
  homeTeamId: number;
  awayTeamId: number;
  /** Optional inferred sets by team id. */
  inferred?: ReadonlyMap<number, SeasonKitSet>;
  corrections?: KitCorrectionMap;
}

export interface ResolvedTeamKitsWithBasis extends TeamKits {
  worn: WornKitDecision;
}

export function seasonKitsForTeam(ctx: FixtureKitContext, teamId: number): SeasonKitSet | null {
  return mergeSeasonKits(catalogSeasonKits(teamId, ctx.season), ctx.inferred?.get(teamId) ?? null);
}

/**
 * Resolve one team's palettes. Season kits are passed into resolveTeamKits
 * only when a worn slot has been chosen (verified or convention).
 */
export function resolveTeamKitsWithSeason(
  ctx: FixtureKitContext,
  teamId: number,
  apiColors: unknown,
): ResolvedTeamKitsWithBasis {
  const isHome = teamId === ctx.homeTeamId;
  const set = seasonKitsForTeam(ctx, teamId);
  const opponentId = isHome ? ctx.awayTeamId : ctx.homeTeamId;
  const opponentSet = seasonKitsForTeam(ctx, opponentId);
  let opponentPrimary: string | null = null;
  if (opponentSet) {
    const oppSlot = pickWornSlot({
      fixtureId: ctx.fixtureId,
      teamId: opponentId,
      isHome: !isHome,
      kits: opponentSet.player,
    });
    opponentPrimary = oppSlot.slot ? slotPalette(opponentSet.player, oppSlot.slot)?.primary ?? null : null;
  }
  const worn = pickWornSlot({
    fixtureId: ctx.fixtureId,
    teamId,
    isHome,
    kits: set?.player,
    opponentPrimary,
  });
  const seasonKits =
    set && worn.slot
      ? {
          player: slotPalette(set.player, worn.slot),
          goalkeeper: slotPalette(set.goalkeeper, worn.slot) ?? set.goalkeeper.home,
        }
      : undefined;

  const kits = resolveTeamKits(ctx.fixtureId, teamId, apiColors, {
    corrections: ctx.corrections ?? KIT_CORRECTIONS,
    seasonKits,
  });
  return { ...kits, worn };
}

/** Apply the season fallback to a stored row when it is missing or still neutral. */
export function applyStoredSeasonFallback(
  ctx: FixtureKitContext,
  teamId: number,
  stored: StoredTeamKits | null | undefined,
): StoredTeamKits | null {
  if (stored && !kitsNeedRefresh(stored)) return stored;
  const resolved = resolveTeamKitsWithSeason(ctx, teamId, null);
  if (resolved.player.source === 'neutral' && resolved.goalkeeper.source === 'neutral') {
    return stored ?? {
      player: resolved.player,
      goalkeeper: resolved.goalkeeper,
    };
  }
  // Prefer a newly resolved season/correction palette on a role that was grey.
  if (!stored) {
    return { player: resolved.player, goalkeeper: resolved.goalkeeper };
  }
  return {
    player: stored.player.source === 'neutral' ? resolved.player : stored.player,
    goalkeeper: stored.goalkeeper.source === 'neutral' ? resolved.goalkeeper : stored.goalkeeper,
  };
}
