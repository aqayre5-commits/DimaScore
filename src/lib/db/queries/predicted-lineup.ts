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

interface SquadRow {
  id: string;
  name: Record<string, string>;
  photo_url: string | null;
  position: string | null;
  shirt_number: number | null;
}

/** Long-form API position → broad bucket used by the pitch. */
const POS_BUCKET: Record<string, string> = {
  Goalkeeper: 'G',
  Defender: 'D',
  Midfielder: 'M',
  Attacker: 'F',
};
const toBucket = (p: string | null): string => (p ? (POS_BUCKET[p] ?? 'M') : 'M');

interface Ranked {
  id: number;
  pos: string;
  starts: number;
  minutes: number;
  name: Record<string, string>;
  photo: string | null;
  number: number | null;
}

/**
 * Derive a probable starting XI for a team from recent data — shown on upcoming match
 * pages (where no real lineup exists yet). Heuristic, labelled "Predicted" in the UI.
 *
 * - Formation: the team's most-common real formation from recent lineups
 *   (fixture_lineups.formation), e.g. 4-1-4-1; falls back to inferring D/M/F counts from
 *   appearances, and finally 4-3-3.
 * - Players: national teams are anchored to the squad (tournament_squads, WC-preferred,
 *   else squad_members), ranked by recent form; clubs use the players who appeared in the
 *   last RECENT_N matches.
 */
export async function getPredictedLineup(
  db: NeonHttpDatabase<typeof schema>,
  teamId: number,
  locale: string,
): Promise<MatchLineup | null> {
  // ── Recent appearances (form + inferred positions) ──
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

  const isStarter = (r: Row) => r.substitute !== true && (r.substitute as unknown) !== 't';

  // Form per player (starts, minutes, dominant position) from recent appearances.
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

  // ── Jersey numbers from ingested lineups (fallback when players.shirt_number is null) ──
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

  // ── Formation: prefer the team's most-common real formation from recent lineups ──
  const fmtRes = await db.execute(sql`
    WITH recent AS (
      SELECT id FROM fixtures
      WHERE (home_team_id = ${teamId} OR away_team_id = ${teamId})
        AND status_code IN ('FT','AET','PEN')
      ORDER BY kickoff_at DESC
      LIMIT ${RECENT_N}
    )
    SELECT fl.formation AS formation, count(*) AS n
    FROM fixture_lineups fl
    JOIN recent r ON r.id = fl.fixture_id
    WHERE fl.team_id = ${teamId} AND fl.formation IS NOT NULL
    GROUP BY fl.formation
    ORDER BY n DESC
    LIMIT 1
  `);
  const realFormation = (fmtRes.rows[0] as { formation: string } | undefined)?.formation ?? null;

  let d: number;
  let m: number;
  let f: number;
  let formation: string;
  const segs = realFormation?.split('-').map(Number);
  if (
    segs &&
    segs.length >= 3 &&
    segs.every((x) => Number.isInteger(x) && x > 0) &&
    segs.reduce((a, b) => a + b, 0) === 10
  ) {
    // Real formation: defenders = first segment, forwards = last, mids = the rest.
    d = segs[0];
    f = segs[segs.length - 1];
    m = 10 - d - f;
    formation = realFormation as string;
  } else {
    // Fallback: infer D/M/F counts from recent appearances, else 4-3-3.
    const fxBuckets = new Map<string, { D: number; F: number }>();
    for (const r of rows) {
      if (!isStarter(r)) continue;
      const b = fxBuckets.get(r.fixture_id) ?? { D: 0, F: 0 };
      if (r.position === 'D') b.D++;
      else if (r.position === 'F') b.F++;
      fxBuckets.set(r.fixture_id, b);
    }
    const nFx = fxBuckets.size || 1;
    let dd = 0;
    let ff = 0;
    for (const b of fxBuckets.values()) {
      dd += b.D;
      ff += b.F;
    }
    d = Math.round(dd / nFx);
    f = Math.round(ff / nFx);
    m = 10 - d - f;
    if (d < 3 || d > 5 || f < 1 || f > 4 || m < 2 || d + m + f !== 10) {
      d = 4;
      m = 3;
      f = 3;
    }
    formation = `${d}-${m}-${f}`;
  }

  // ── Player pool ──
  // National teams: anchor to the squad (tournament_squads WC-preferred, else squad_members),
  // ranked by recent form. Clubs: the players who appeared in the recent matches.
  const teamRes = await db.execute(sql`SELECT is_national FROM teams WHERE id = ${teamId}`);
  const isNational =
    (teamRes.rows[0] as { is_national: boolean } | undefined)?.is_national === true;

  let squadRows: SquadRow[] = [];
  if (isNational) {
    const tsRes = await db.execute(sql`
      SELECT pl.id::bigint AS id, pl.name, pl.photo_url, pl.position, pl.shirt_number
      FROM tournament_squads ts
      JOIN players pl ON pl.id = ts.player_id
      WHERE ts.team_id = ${teamId}
        AND (ts.competition_id, ts.season_year) = (
          SELECT competition_id, season_year FROM tournament_squads
          WHERE team_id = ${teamId}
          ORDER BY (competition_id = 1) DESC, season_year DESC
          LIMIT 1
        )
    `);
    squadRows = tsRes.rows as unknown as SquadRow[];
    if (squadRows.length === 0) {
      const smRes = await db.execute(sql`
        SELECT pl.id::bigint AS id, pl.name, pl.photo_url, pl.position, pl.shirt_number
        FROM squad_members sm
        JOIN players pl ON pl.id = sm.player_id
        WHERE sm.team_id = ${teamId}
      `);
      squadRows = smRes.rows as unknown as SquadRow[];
    }
  }

  let players: Ranked[];
  if (squadRows.length > 0) {
    players = squadRows.map((sp) => {
      const form = byPlayer.get(String(sp.id));
      return {
        id: Number(sp.id),
        pos: toBucket(sp.position),
        starts: form?.starts ?? 0,
        minutes: form?.minutes ?? 0,
        name: sp.name,
        photo: sp.photo_url,
        number: sp.shirt_number,
      };
    });
  } else {
    if (rows.length === 0) return null;
    players = [...byPlayer.entries()].map(([id, e]) => ({
      id: Number(id),
      pos: Object.entries(e.posCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'M',
      starts: e.starts,
      minutes: e.minutes,
      name: e.name,
      photo: e.photo,
      number: null,
    }));
  }

  // ── Pick the XI: GK, then D/M/F by recent form, ordered to fill the formation rows ──
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
    number: p.number ?? numberMap.get(p.id) ?? 0,
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
