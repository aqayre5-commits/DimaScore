import { describe, expect, it } from 'vitest';
import {
  buildTallies,
  currentSeasonOf,
  rankTallies,
  scorerLines,
  squadPosition,
} from '@/lib/team/page-model';
import type { TeamMatchEvent } from '@/lib/db/queries/team-page';

const ev = (p: Partial<TeamMatchEvent>): TeamMatchEvent => ({
  fixtureId: 1,
  teamId: 42,
  playerId: null,
  assistPlayerId: null,
  type: 'Goal',
  detail: 'Normal Goal',
  minute: 10,
  extraMinute: null,
  ...p,
});

describe('team page model', () => {
  it('maps feed positions to squad groups', () => {
    expect(['Goalkeeper', 'D', 'Midfielder', 'Attacker', 'F', null].map(squadPosition)).toEqual([
      'GK',
      'DF',
      'MF',
      'FW',
      'FW',
      null,
    ]);
  });

  it('picks the current season, rolling over to the next season after the summer', () => {
    const now = Date.parse('2026-07-20T00:00:00Z');
    expect(
      currentSeasonOf(
        [
          { kickoffAt: '2026-05-20T00:00:00Z', seasonYear: 2025 },
          { kickoffAt: '2026-08-15T00:00:00Z', seasonYear: 2026 },
        ],
        now,
      ),
    ).toBe(2026);
    expect(currentSeasonOf([{ kickoffAt: '2026-05-20T00:00:00Z', seasonYear: 2025 }], now)).toBe(
      2025,
    );
  });

  it('tallies goals, assists, cards, starts and substitute appearances per competition', () => {
    const names: Record<number, string> = {
      7: 'Bukayo Saka',
      8: 'Martin Ødegaard',
      9: 'Gabriel Jesus',
    };
    const tallies = buildTallies(
      42,
      [
        { id: 1, competitionId: 39 },
        { id: 2, competitionId: 2 },
      ],
      [
        ev({ playerId: 7, assistPlayerId: 8 }),
        ev({ fixtureId: 2, playerId: 7, detail: 'Penalty' }),
        ev({ playerId: 7, detail: 'Missed Penalty' }),
        ev({ playerId: 5, detail: 'Own Goal' }),
        ev({ teamId: 1, playerId: 99 }),
        ev({ type: 'Card', detail: 'Yellow Card', playerId: 8 }),
        ev({ type: 'subst', detail: 'Substitution 1', playerId: 7, assistPlayerId: 9 }),
      ],
      [
        {
          fixtureId: 1,
          starters: [
            { id: 7, name: 'B. Saka', number: 7, pos: 'F' },
            { id: 8, name: 'M. Ødegaard', number: 8, pos: 'M' },
          ],
          substitutes: [{ id: 9, name: 'G. Jesus', number: 9, pos: 'F' }],
        },
      ],
      (id) => names[id] ?? null,
    );
    const goals = rankTallies(tallies, 'all', 'goals');
    expect(goals).toEqual([{ key: '7', playerId: 7, name: 'Bukayo Saka', value: 2, rank: 1 }]);
    expect(rankTallies(tallies, 39, 'goals')[0].value).toBe(1);
    expect(rankTallies(tallies, 'all', 'assists').map((x) => x.name)).toEqual(['Martin Ødegaard']);
    expect(rankTallies(tallies, 'all', 'yellow')[0].playerId).toBe(8);
    expect(rankTallies(tallies, 'all', 'apps').map((x) => [x.playerId, x.value])).toEqual(
      [
        [9, 1],
        [8, 1],
        [7, 1],
      ].sort((a, b) => names[a[0]].localeCompare(names[b[0]])),
    );
    expect(
      rankTallies(tallies, 'all', 'starts')
        .map((x) => x.playerId)
        .sort(),
    ).toEqual([7, 8]);
  });

  it('uses competition ranking for ties', () => {
    const base = { competitionId: 1, assists: 0, apps: 0, starts: 0, yellow: 0, red: 0 };
    const r = rankTallies(
      [
        { ...base, key: 'a', playerId: 1, name: 'A', goals: 3 },
        { ...base, key: 'b', playerId: 2, name: 'B', goals: 3 },
        { ...base, key: 'c', playerId: 3, name: 'C', goals: 1 },
      ],
      'all',
      'goals',
    );
    expect(r.map((x) => x.rank)).toEqual([1, 1, 3]);
  });

  it('builds hero scorer lines, own goals under the team they counted for', () => {
    const names: Record<number, string> = { 7: 'Bukayo Saka', 5: 'Ben White' };
    const events = [
      ev({ playerId: 7, minute: 12 }),
      ev({ playerId: 7, minute: 45, extraMinute: 2 }),
      ev({ playerId: 5, detail: 'Own Goal', minute: 70 }),
    ];
    expect(scorerLines(events, 1, 42, 1, (id) => names[id] ?? null)).toEqual(['Saka 12′, 45+2′']);
    expect(scorerLines(events, 1, 1, 42, (id) => names[id] ?? null)).toEqual(['White 70′ (OG)']);
  });
});
