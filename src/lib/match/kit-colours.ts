/**
 * Per-fixture shirt palettes for the line-ups pitch.
 *
 * API-Football sends team.colors.player / team.colors.goalkeeper as
 * { primary, number, border } 6-digit hex (no #). Palettes are resolved once
 * at ingestion and stored on the fixture lineup row so every view reads the
 * same values. Matching is always by team.id — never by home/away order.
 */

export type KitRole = 'player' | 'goalkeeper';
export type KitSource = 'correction' | 'api' | 'season' | 'neutral';

export interface KitPalette {
  /** Shirt body and sleeves. */
  primary: string;
  /** Shirt number. */
  number: string;
  /** Shirt outline / collar stroke. */
  border: string;
}

export interface ResolvedKitPalette extends KitPalette {
  source: KitSource;
}

export interface TeamKits {
  teamId: number;
  player: ResolvedKitPalette;
  goalkeeper: ResolvedKitPalette;
}

export interface KitRoleInput {
  primary?: string | null;
  number?: string | null;
  border?: string | null;
}

export type KitCorrectionMap = Record<
  string, // `${fixtureId}:${teamId}`
  { player?: KitRoleInput; goalkeeper?: KitRoleInput }
>;

/** Neutral grey shirt, dark number — used when no verified primary is available. */
export const NEUTRAL_KIT: KitPalette = {
  primary: '#c8cdd1',
  number: '#1a1a1a',
  border: '#4a4f54',
};

/** Accept 6-digit hex with or without a leading #; otherwise null. */
export function parseHex(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  return `#${s.toLowerCase()}`;
}

function lin(c: number) {
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance of a #rrggbb colour, 0–1. */
export function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!);
}

/** Black or white number, picked for contrast against the shirt body. */
export function contrastNumber(primary: string): '#111111' | '#f5f5f5' {
  return luminance(primary) > 0.55 ? '#111111' : '#f5f5f5';
}

/** Subtle highlight for the drawing's collar/sleeve tips — not a kit pattern. */
export function shirtTrim(primary: string): string {
  return luminance(primary) > 0.55 ? '#d9dce0' : '#f4f6f8';
}

export function kitCorrectionKey(fixtureId: number, teamId: number) {
  return `${fixtureId}:${teamId}`;
}

/**
 * Goalkeeper by position only — never by shirt number (Kovář wears 32 and is a GK).
 * API-Football uses "G"; some feeds use "GK" or "Goalkeeper".
 */
export function isGoalkeeperPos(pos: string | null | undefined): boolean {
  if (!pos) return false;
  const p = pos.trim().toUpperCase();
  return p === 'G' || p === 'GK' || p === 'GOALKEEPER';
}

export function parseApiRole(raw: unknown): KitRoleInput | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const primary = parseHex(o.primary);
  const number = parseHex(o.number);
  const border = parseHex(o.border);
  if (!primary && !number && !border) return null;
  return { primary, number, border };
}

export function parseApiTeamColors(raw: unknown): {
  player: KitRoleInput | null;
  goalkeeper: KitRoleInput | null;
} {
  if (!raw || typeof raw !== 'object') return { player: null, goalkeeper: null };
  const o = raw as Record<string, unknown>;
  return { player: parseApiRole(o.player), goalkeeper: parseApiRole(o.goalkeeper) };
}

export function resolveRolePalette(opts: {
  fixtureId: number;
  teamId: number;
  role: KitRole;
  api?: KitRoleInput | null;
  /** Verified fixture correction — wins over the API. */
  correction?: KitRoleInput | null;
  /**
   * A season kit, used only when the primary is missing AND it is known which
   * kit was worn for this fixture. Never applied just because a team has a kit.
   */
  seasonKit?: KitPalette | null;
}): ResolvedKitPalette {
  const corr = opts.correction ?? null;
  const api = opts.api ?? null;

  const corrPrimary = parseHex(corr?.primary);
  const apiPrimary = parseHex(api?.primary);
  const seasonPrimary = opts.seasonKit ? parseHex(opts.seasonKit.primary) : null;

  let source: KitSource;
  let primary: string;
  if (corrPrimary) {
    source = 'correction';
    primary = corrPrimary;
  } else if (apiPrimary) {
    source = 'api';
    primary = apiPrimary;
  } else if (seasonPrimary) {
    source = 'season';
    primary = seasonPrimary;
  } else {
    source = 'neutral';
    primary = NEUTRAL_KIT.primary;
  }

  const number =
    parseHex(corr?.number) ??
    parseHex(api?.number) ??
    (source === 'season' ? (opts.seasonKit?.number ?? null) : null) ??
    contrastNumber(primary);

  const border =
    parseHex(corr?.border) ??
    parseHex(api?.border) ??
    (source === 'season' ? (opts.seasonKit?.border ?? null) : null) ??
    number;

  return { primary, number, border, source };
}

export function resolveTeamKits(
  fixtureId: number,
  teamId: number,
  apiColors: unknown,
  options?: {
    corrections?: KitCorrectionMap;
    seasonKits?: { player?: KitPalette | null; goalkeeper?: KitPalette | null };
  },
): TeamKits {
  const api = parseApiTeamColors(apiColors);
  const corr = options?.corrections?.[kitCorrectionKey(fixtureId, teamId)];
  return {
    teamId,
    player: resolveRolePalette({
      fixtureId,
      teamId,
      role: 'player',
      api: api.player,
      correction: corr?.player,
      seasonKit: options?.seasonKits?.player,
    }),
    goalkeeper: resolveRolePalette({
      fixtureId,
      teamId,
      role: 'goalkeeper',
      api: api.goalkeeper,
      correction: corr?.goalkeeper,
      seasonKit: options?.seasonKits?.goalkeeper,
    }),
  };
}

/** Look up a team's saved kits by team.id, ignoring array order. */
export function kitsForTeam(kits: readonly TeamKits[], teamId: number): TeamKits | undefined {
  return kits.find((k) => k.teamId === teamId);
}

export function kitCssVars(palette: KitPalette): Record<string, string> {
  return {
    '--kit': palette.primary,
    '--shirt-sleeve': palette.primary,
    '--shirt-edge': palette.border,
    '--shirt-number': palette.number,
    '--shirt-trim': shirtTrim(palette.primary),
  };
}

/** True when a stored row should be refreshed from the API (no saved kit, or only a fallback). */
export type StoredTeamKits = {
  player: ResolvedKitPalette;
  goalkeeper: ResolvedKitPalette;
};

export function kitsNeedRefresh(stored: StoredTeamKits | TeamKits | null | undefined): boolean {
  if (!stored) return true;
  return stored.player.source === 'neutral' || stored.goalkeeper.source === 'neutral';
}

export function fixturesWithCompleteKits(
  rows: {
    fixtureId: number;
    colors?: TeamKits | { player: ResolvedKitPalette; goalkeeper: ResolvedKitPalette } | null;
  }[],
): Set<number> {
  const grouped = new Map<number, typeof rows>();
  for (const row of rows) {
    const list = grouped.get(row.fixtureId) ?? [];
    list.push(row);
    grouped.set(row.fixtureId, list);
  }
  const ready = new Set<number>();
  for (const [id, list] of grouped) {
    if (list.length >= 2 && list.every((r) => !kitsNeedRefresh(r.colors ?? null))) ready.add(id);
  }
  return ready;
}
