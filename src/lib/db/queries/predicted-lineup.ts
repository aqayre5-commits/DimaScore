import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import { cacheLife } from 'next/cache';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import type { MatchLineup, LineupPlayer } from './match-detail';

const RECENT_N = 6;

interface Row {
  fixture_id: string;
  player_id: string;
  position: string | null;
  substitute: boolean;
  minutes_played: number | null;
  name: Record<string, string>;
  photo_url: string | null;
}

/**
 * Derive a probable starting XI for a team from its recent appearances —
 * shown on upcoming match pages (where no real lineup exists yet). Heuristic,
 * labelled "Predicted" in the UI. Formation is inferred from the average number
 * of starters per outfield bucket across recent matches (fallback 4-3-3).
 */
export async function getPredictedLineup(
  db: NeonHttpDatabase<typeof schema>,
  teamId: number,
  locale: string,
): Promise<MatchLineup | null> {
  const res = await db.execute(sql`
    WITH recent AS (
      SELECT id FROM fixtures
      WHERE (home_team_id = ${teamId} OR away_team_id = ${teamId})
        AND status_code IN ('FT','AET','PEN')
      ORDER BY kickoff_at DESC
      LIMIT ${RECENT_N}
    )
    SELECT p.fixture_id, p.player_id, p.position, p.substitute, p.minutes_played,
           pl.name, pl.photo_url
    FROM fixture_player_stats p
    JOIN recent r ON r.id = p.fixture_id
    JOIN players pl ON pl.id = p.player_id
    WHERE p.team_id = ${teamId}
  `);
  const rows = res.rows as unknown as Row[];
  if (rows.length === 0) return null;

  // Jersey numbers (no dedicated column) — pulled from the team's ingested
  // lineups (fixture_lineups.starters/substitutes JSONB), most-common per player.
  const numRes = await db.execute(sql`
    SELECT (j.s->>'id')::bigint AS pid, (j.s->>'number')::int AS num
    FROM fixture_lineups fl
    CROSS JOIN LATERAL (
      SELECT jsonb_array_elements(fl.starters) AS s
      UNION ALL
      SELECT jsonb_array_elements(fl.substitutes) AS s
    ) j
    WHERE fl.team_id = ${teamId} AND j.s->>'number' IS NOT NULL
  `);
  const numCounts = new Map<number, Map<number, number>>();
  for (const nr of numRes.rows as unknown as { pid: string; num: number }[]) {
    const pid = Number(nr.pid);
    const counts = numCounts.get(pid) ?? new Map<number, number>();
    counts.set(Number(nr.num), (counts.get(Number(nr.num)) ?? 0) + 1);
    numCounts.set(pid, counts);
  }
  const numberMap = new Map<number, number>();
  for (const [pid, counts] of numCounts) {
    const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (best) numberMap.set(pid, best[0]);
  }

  const isStarter = (r: Row) => r.substitute !== true && (r.substitute as unknown) !== 't';

  // ── Infer formation: average starters per outfield bucket across fixtures ──
  const fxBuckets = new Map<string, { D: number; M: number; F: number }>();
  for (const r of rows) {
    if (!isStarter(r)) continue;
    const b = fxBuckets.get(r.fixture_id) ?? { D: 0, M: 0, F: 0 };
    if (r.position === 'D') b.D++;
    else if (r.position === 'M') b.M++;
    else if (r.position === 'F') b.F++;
    fxBuckets.set(r.fixture_id, b);
  }
  const nFx = fxBuckets.size || 1;
  let d = 0;
  let m = 0;
  let f = 0;
  for (const b of fxBuckets.values()) {
    d += b.D;
    m += b.M;
    f += b.F;
  }
  d = Math.round(d / nFx);
  f = Math.round(f / nFx);
  m = 10 - d - f;
  // Fallback to 4-3-3 for implausible shapes
  if (d < 3 || d > 5 || f < 1 || f > 4 || m < 2 || d + m + f !== 10) {
    d = 4;
    m = 3;
    f = 3;
  }
  const formation = `${d}-${m}-${f}`;

  // ── Rank players: starts within their dominant position ──
  const byPlayer = new Map<
    string,
    {
      starts: number;
      minutes: number;
      posCount: Record<string, number>;
      name: Record<string, string>;
      photo: string | null;
    }
  >();
  for (const r of rows) {
    const e = byPlayer.get(r.player_id) ?? {
      starts: 0,
      minutes: 0,
      posCount: {},
      name: r.name,
      photo: r.photo_url,
    };
    if (isStarter(r)) e.starts++;
    e.minutes += r.minutes_played ?? 0;
    if (r.position) e.posCount[r.position] = (e.posCount[r.position] ?? 0) + 1;
    byPlayer.set(r.player_id, e);
  }

  interface Ranked {
    id: number;
    pos: string;
    starts: number;
    minutes: number;
    name: Record<string, string>;
    photo: string | null;
  }
  const players: Ranked[] = [...byPlayer.entries()].map(([id, e]) => ({
    id: Number(id),
    pos: Object.entries(e.posCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'M',
    starts: e.starts,
    minutes: e.minutes,
    name: e.name,
    photo: e.photo,
  }));

  const byStarts = (a: Ranked, b: Ranked) => b.starts - a.starts || b.minutes - a.minutes;
  const picked: Ranked[] = [];
  const take = (pool: Ranked[], n: number) => {
    for (const p of pool) {
      if (picked.length >= 11 || n <= 0) break;
      if (!picked.includes(p)) {
        picked.push(p);
        n--;
      }
    }
  };
  // Order matters: LineupPitch fills formation rows GK → D → M → F sequentially.
  take(players.filter((p) => p.pos === 'G').sort(byStarts), 1);
  take(players.filter((p) => p.pos === 'D').sort(byStarts), d);
  take(players.filter((p) => p.pos === 'M').sort(byStarts), m);
  take(players.filter((p) => p.pos === 'F').sort(byStarts), f);
  if (picked.length < 11) {
    take(players.filter((p) => !picked.includes(p)).sort(byStarts), 11 - picked.length);
  }
  if (picked.length < 11) return null;

  const resolveName = (n: Record<string, string>) =>
    n[locale] ?? n['en'] ?? Object.values(n)[0] ?? '—';

  const starters: LineupPlayer[] = picked.map((p) => ({
    id: p.id,
    name: resolveName(p.name),
    number: numberMap.get(p.id) ?? 0,
    pos: p.pos,
    grid: null,
    photoUrl: p.photo,
  }));

  return { teamId, formation, coach: null, starters, substitutes: [] };
}

/** Cached pair-fetch for the match page (keeps the route PPR-clean). */
export async function getCachedPredictedXI(
  homeTeamId: number,
  awayTeamId: number,
  locale: string,
): Promise<{ home: MatchLineup | null; away: MatchLineup | null }> {
  'use cache';
  cacheLife('hours');
  const [home, away] = await Promise.all([
    getPredictedLineup(db, homeTeamId, locale),
    getPredictedLineup(db, awayTeamId, locale),
  ]);
  return { home, away };
}
