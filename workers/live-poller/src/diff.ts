import type { NormalizedFixture } from '@/lib/data/types';

export interface FixtureRow {
  id: number;
  homeScore: number | null;
  awayScore: number | null;
  statusCode: string;
  minute: number | null;
}

export interface FixtureDelta {
  fixtureId: number;
  changes: string[];
}

export function computeDeltas(
  liveFixtures: NormalizedFixture[],
  dbMap: Map<number, FixtureRow>,
): FixtureDelta[] {
  const deltas: FixtureDelta[] = [];

  for (const fixture of liveFixtures) {
    const dbRow = dbMap.get(fixture.id);
    const changes: string[] = [];

    if (!dbRow) {
      changes.push('new');
    } else {
      if (dbRow.homeScore !== fixture.goals.home) changes.push('homeScore');
      if (dbRow.awayScore !== fixture.goals.away) changes.push('awayScore');
      if (dbRow.statusCode !== fixture.status.short) changes.push('statusCode');
      if (dbRow.minute !== fixture.status.elapsed) changes.push('minute');
    }

    if (changes.length > 0) {
      deltas.push({ fixtureId: fixture.id, changes });
    }
  }

  return deltas;
}
