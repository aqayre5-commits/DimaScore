/**
 * Shared, READ-ONLY resolver: maps a NationSquad's FIFA player names to our
 * players.id. Used by resolve-wc2026-squads.ts (report) and
 * seed-wc2026-squads.ts (writes only the high-confidence matches).
 *
 * Strategy: load every player once into an in-memory, accent-insensitive token
 * index. A name's token set includes single tokens (len>=3) AND adjacent-pair
 * concatenations, so hyphenated/spaced romanizations match ("Kim Min-Jae" ≡
 * "Kim Minjae"). Ranking = shared-token overlap*10 + a given-name initial bonus
 * (so "G. Ochoa" beats "Iker … Ochoa" for "Guillermo Ochoa").
 *
 *  - 'pool'   : unique best match within the team's squad_members pool (trusted)
 *  - 'global' : unique best match across ALL players — spot-check
 *  - ambiguous: tie at the top (e.g. two same-surname players) — never seeded
 *  - missing  : no candidate in DB — needs ingesting from API-Football
 */
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import type { NationSquad, SquadEntry } from './data/wc2026-squads';
import { WC2026_OVERRIDES } from './data/wc2026-overrides';

export type MatchSource = 'pool' | 'global' | 'override';
export type MatchStatus = 'matched' | 'ambiguous' | 'missing';

export interface Candidate {
  id: number;
  name: string;
  teams: string | null;
}

export interface PlayerResolution {
  entry: SquadEntry;
  status: MatchStatus;
  source?: MatchSource;
  playerId?: number;
  dbName?: string;
  candidates?: Candidate[];
}

export interface NationResolution {
  nation: NationSquad;
  teamId: number | null;
  poolSize: number;
  results: PlayerResolution[];
}

function rawTokens(s: string): string[] {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

/** Long single tokens (>=3) plus adjacent-pair concatenations (>=4). */
function tokenSet(raw: string[]): Set<string> {
  const set = new Set<string>();
  for (const x of raw) if (x.length >= 3) set.add(x);
  for (let i = 0; i < raw.length - 1; i++) {
    const pair = raw[i] + raw[i + 1];
    if (pair.length >= 4) set.add(pair);
  }
  return set;
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
}

/** +5 when a single-letter token on one side matches the first letter of a token on the other. */
function initialBonus(aRaw: string[], bRaw: string[]): number {
  const aSingles = aRaw.filter((t) => t.length === 1).map((t) => t[0]);
  const bSingles = bRaw.filter((t) => t.length === 1).map((t) => t[0]);
  const aFirsts = new Set(aRaw.map((t) => t[0]));
  const bFirsts = new Set(bRaw.map((t) => t[0]));
  return aSingles.some((c) => bFirsts.has(c)) || bSingles.some((c) => aFirsts.has(c)) ? 5 : 0;
}

interface IndexedPlayer {
  id: number;
  name: string;
  raw: string[];
  tokens: Set<string>;
}

let ALL: IndexedPlayer[] | null = null;
let TOKEN_INDEX: Map<string, number[]> | null = null;
let ID_TO_INDEX: Map<number, number> | null = null;

async function ensureLoaded(): Promise<void> {
  if (ALL) return;
  const rows = await db.execute(
    sql`SELECT id, name->>'en' AS name FROM players WHERE name->>'en' IS NOT NULL`,
  );
  ALL = (rows.rows as { id: string; name: string }[]).map((r) => {
    const raw = rawTokens(r.name);
    return { id: Number(r.id), name: r.name, raw, tokens: tokenSet(raw) };
  });
  TOKEN_INDEX = new Map();
  ID_TO_INDEX = new Map();
  ALL.forEach((p, i) => {
    ID_TO_INDEX!.set(p.id, i);
    for (const tok of p.tokens) {
      let arr = TOKEN_INDEX!.get(tok);
      if (!arr) {
        arr = [];
        TOKEN_INDEX!.set(tok, arr);
      }
      arr.push(i);
    }
  });
}

function candidateIndices(entryTokens: Set<string>): number[] {
  const seen = new Set<number>();
  for (const tok of entryTokens) {
    const arr = TOKEN_INDEX!.get(tok);
    if (arr) for (const i of arr) seen.add(i);
  }
  return [...seen];
}

/** Best unique candidate by score; null on no-viable or a top tie. */
function bestUnique(
  entryRaw: string[],
  entryTokens: Set<string>,
  indices: number[],
): { index: number | null; viable: number[] } {
  const viable = indices.filter((i) => overlap(entryTokens, ALL![i].tokens) >= 1);
  if (viable.length === 0) return { index: null, viable: [] };
  const scoreOf = (i: number) =>
    overlap(entryTokens, ALL![i].tokens) * 10 + initialBonus(entryRaw, ALL![i].raw);
  let best = viable[0];
  let bestScore = scoreOf(best);
  let tie = false;
  for (let k = 1; k < viable.length; k++) {
    const s = scoreOf(viable[k]);
    if (s > bestScore) {
      best = viable[k];
      bestScore = s;
      tie = false;
    } else if (s === bestScore) {
      tie = true;
    }
  }
  return { index: tie ? null : best, viable };
}

export async function resolveNation(nation: NationSquad): Promise<NationResolution> {
  await ensureLoaded();

  const teamRows = await db.execute(
    sql`SELECT id FROM teams WHERE name->>'en' = ${nation.dbName}
        ORDER BY is_national DESC NULLS LAST LIMIT 1`,
  );
  const teamId = teamRows.rows.length ? Number((teamRows.rows[0] as { id: string }).id) : null;
  if (teamId == null) {
    return {
      nation,
      teamId: null,
      poolSize: 0,
      results: nation.players.map((entry) => ({ entry, status: 'missing' as const })),
    };
  }

  const poolRows = await db.execute(
    sql`SELECT player_id FROM squad_members WHERE team_id = ${teamId}`,
  );
  const poolSet = new Set(
    (poolRows.rows as { player_id: string }[]).map((r) => Number(r.player_id)),
  );

  const results: PlayerResolution[] = [];
  const teamsNeeded = new Set<number>();
  const claimed = new Set<number>(); // a DB player can back only one squad slot

  for (const entry of nation.players) {
    // Manual pin wins over any heuristic.
    const overrideId = WC2026_OVERRIDES[nation.dbName]?.[entry.name];
    if (overrideId != null) {
      const idx = ID_TO_INDEX!.get(overrideId);
      claimed.add(overrideId);
      results.push({
        entry,
        status: 'matched',
        source: 'override',
        playerId: overrideId,
        dbName: idx != null ? ALL![idx].name : undefined,
      });
      continue;
    }

    const eRaw = rawTokens(entry.name);
    const et = tokenSet(eRaw);
    const cand = candidateIndices(et).filter((i) => !claimed.has(ALL![i].id));

    const poolCand = cand.filter((i) => poolSet.has(ALL![i].id));
    const poolBest = bestUnique(eRaw, et, poolCand);
    if (poolBest.index != null) {
      const p = ALL![poolBest.index];
      claimed.add(p.id);
      results.push({ entry, status: 'matched', source: 'pool', playerId: p.id, dbName: p.name });
      continue;
    }

    const gBest = bestUnique(eRaw, et, cand);
    if (gBest.index != null) {
      const p = ALL![gBest.index];
      claimed.add(p.id);
      results.push({ entry, status: 'matched', source: 'global', playerId: p.id, dbName: p.name });
      teamsNeeded.add(p.id);
    } else if (gBest.viable.length > 1) {
      const candidates = gBest.viable
        .slice(0, 6)
        .map((i) => ({ id: ALL![i].id, name: ALL![i].name, teams: null as string | null }));
      candidates.forEach((c) => teamsNeeded.add(c.id));
      results.push({ entry, status: 'ambiguous', candidates });
    } else {
      results.push({ entry, status: 'missing' });
    }
  }

  if (teamsNeeded.size > 0) {
    const idList = [...teamsNeeded];
    const teamRowsRes = await db.execute(
      sql`SELECT sm.player_id, string_agg(DISTINCT t.name->>'en', ', ') AS teams
          FROM squad_members sm JOIN teams t ON t.id = sm.team_id
          WHERE sm.player_id IN (${sql.join(
            idList.map((id) => sql`${id}`),
            sql`, `,
          )})
          GROUP BY sm.player_id`,
    );
    const teamMap = new Map(
      (teamRowsRes.rows as { player_id: string; teams: string | null }[]).map((r) => [
        Number(r.player_id),
        r.teams,
      ]),
    );
    for (const r of results) {
      if (r.status === 'matched' && r.source === 'global' && r.playerId != null) {
        r.candidates = [
          { id: r.playerId, name: r.dbName ?? '', teams: teamMap.get(r.playerId) ?? null },
        ];
      } else if (r.status === 'ambiguous' && r.candidates) {
        for (const c of r.candidates) c.teams = teamMap.get(c.id) ?? null;
      }
    }
  }

  return { nation, teamId, poolSize: poolSet.size, results };
}
