import { and, eq } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DataProvider } from '@/lib/data/provider';
import type { NormalizedStandingEntry } from '@/lib/data/types';
import * as schema from '@/lib/db/schema';
import { runWrites } from '@/lib/db/client';
import type { SyncStats } from './types';

// ─── Mapper (exported for testing) ───

export function mapStandingToInsert(
  entry: NormalizedStandingEntry,
  competitionId: number,
  seasonYear: number,
  groupLabelOverride?: string,
) {
  return {
    competitionId,
    seasonYear,
    groupLabel: (groupLabelOverride ?? entry.group ?? '').trim(),
    teamId: entry.team.id,
    rank: entry.rank,
    points: entry.points,
    played: entry.all.played,
    won: entry.all.win,
    drawn: entry.all.draw,
    lost: entry.all.lose,
    goalsFor: entry.all.goalsFor,
    goalsAgainst: entry.all.goalsAgainst,
    goalDiff: entry.goalsDiff,
    form: entry.form,
    description: entry.description,
  };
}

/**
 * Some multi-group cups (e.g. UEFA Nations League) come back as separate 4-team group arrays whose
 * `group` label repeats across leagues ("Group 1" in League A, B, C, D…). Left as-is they collapse
 * into one table per label. When labels collide across the group arrays, disambiguate by
 * reconstructing the league (reset the counter each time the group number returns to 1) →
 * "League A · Group 1". Cups with already-distinct labels ("Group A"/"Group B") are unchanged.
 */
export function disambiguateGroupLabels(groups: NormalizedStandingEntry[][]): string[] {
  const raw = groups.map((g) => (g[0]?.group ?? '').trim());
  const counts = new Map<string, number>();
  for (const l of raw) counts.set(l, (counts.get(l) ?? 0) + 1);
  const collides = [...counts.values()].some((c) => c > 1);
  if (!collides) return raw;
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  let leagueIdx = -1;
  return raw.map((l) => {
    const n = /(\d+)/.exec(l)?.[1];
    if (n === '1') leagueIdx += 1;
    const letter = LETTERS[leagueIdx] ?? String(leagueIdx + 1);
    return `League ${letter} · ${l}`;
  });
}

// ─── Sync ───

export async function syncStandings(
  provider: DataProvider,
  db: NeonHttpDatabase<typeof schema>,
  params: { leagueId: number; season: number },
): Promise<SyncStats> {
  const groups = await provider.getStandings({
    league: params.leagueId,
    season: params.season,
  });
  const inserted = 0;
  let updated = 0;

  const groupLabels = disambiguateGroupLabels(groups);

  await runWrites(async (tx) => {
    // Delete-before-insert so changed group labels don't accumulate stale duplicate tables. The
    // provider has relabeled multi-group cups over time (e.g. UEFA Nations League: "Group 1" →
    // "League A · Group 1" → "League A - Group A"); upserting keyed on group_label left every old
    // generation behind. Guarded by `groups.length > 0` so an empty API response can't wipe data.
    if (groups.length > 0) {
      await tx
        .delete(schema.standings)
        .where(
          and(
            eq(schema.standings.competitionId, params.leagueId),
            eq(schema.standings.seasonYear, params.season),
          ),
        );
    }
    for (let gi = 0; gi < groups.length; gi++) {
      const group = groups[gi];
      for (const entry of group) {
        const row = mapStandingToInsert(entry, params.leagueId, params.season, groupLabels[gi]);
        await tx.insert(schema.standings).values(row);
        updated++;
      }
    }
  });

  return { inserted, updated };
}
