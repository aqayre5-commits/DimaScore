/**
 * Identity for players the provider sends without an id (common on youth and
 * low-coverage fixtures). A missing id must not become one shared map key, and
 * a missing name must not be replaced with the team name.
 */

export function coercePlayerId(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && /^-?\d+$/.test(raw.trim())) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** A provider id we can store as a players-table foreign key. */
export function isPersistablePlayerId(raw: unknown): boolean {
  const id = coercePlayerId(raw);
  return id != null && id > 0;
}

export function cleanProviderName(name: string | null | undefined): string | null {
  const trimmed = name?.trim();
  return trimmed ? trimmed : null;
}

/** Fold a name so "Wan  Xiang" and "wan xiang" match, and nothing else does. */
export function normPlayerName(name: string | null | undefined): string | null {
  const trimmed = cleanProviderName(name);
  return trimmed ? trimmed.toLowerCase().replace(/\s+/g, ' ') : null;
}

/**
 * Provider id when it is present and still unused. Otherwise the next free
 * negative id. Negatives never collide with API-Football ids and are not
 * written to the players table.
 */
export function stablePlayerId(raw: unknown, used: Set<number>): number {
  const id = coercePlayerId(raw);
  if (id != null && !used.has(id)) {
    used.add(id);
    return id;
  }
  let n = -1;
  while (used.has(n)) n -= 1;
  used.add(n);
  return n;
}

type LineupLike = {
  starters: ReadonlyArray<{ id: unknown }>;
  substitutes: ReadonlyArray<{ id: unknown }>;
};

export function withStablePlayerIds<T extends LineupLike>(lineup: T, used = new Set<number>()): T {
  const map = <P extends { id: unknown }>(player: P): P => ({
    ...player,
    id: stablePlayerId(player.id, used),
  });
  return {
    ...lineup,
    starters: lineup.starters.map(map),
    substitutes: lineup.substitutes.map(map),
  };
}

/** One shared id space so home and away null-id players do not share a key. */
export function keyLineups<T extends LineupLike>(lineups: readonly T[]): T[] {
  const used = new Set<number>();
  return lineups.map((lineup) => withStablePlayerIds(lineup, used));
}

/**
 * Visible label for a player. A real name wins. A shirt number is next.
 * The last resort is the caller's "Unknown player" string — never a team name.
 */
export function playerDisplayName(
  name: string | null | undefined,
  shirt: number | null | undefined,
  unknownLabel: string,
): string {
  const trimmed = cleanProviderName(name);
  if (trimmed) return trimmed;
  if (typeof shirt === 'number' && Number.isFinite(shirt)) return `#${shirt}`;
  return unknownLabel;
}

export function providerEventFields(event: {
  player?: { id?: unknown; name?: string | null } | null;
  assist?: { id?: unknown; name?: string | null } | null;
}): {
  playerId: number | null;
  playerName: string | null;
  assistPlayerId: number | null;
  assistName: string | null;
} {
  return {
    playerId: coercePlayerId(event.player?.id),
    playerName: cleanProviderName(event.player?.name),
    assistPlayerId: coercePlayerId(event.assist?.id),
    assistName: cleanProviderName(event.assist?.name),
  };
}

function nameMap(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string' && entry.trim()) out[key] = entry;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Prefer the players-table name (it can be localised). Fall back to the
 * provider string kept on the event when the id was null or the row is missing.
 */
export function mergeEventPerson(
  id: number | null,
  joinedName: unknown,
  providerName: string | null | undefined,
): { id: number | null; name: Record<string, string> } | null {
  const joined = nameMap(joinedName);
  const raw = cleanProviderName(providerName);
  if (id == null && !joined && !raw) return null;
  return { id, name: joined ?? (raw ? { en: raw } : {}) };
}
