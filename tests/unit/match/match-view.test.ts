import { describe, expect, it } from 'vitest';
import type { LineupPlayer, MatchEvent } from '@/lib/db/queries/match-detail';
import {
  chronological,
  eventGroup,
  eventKind,
  keyMoments,
  keyStatRows,
  matchSummary,
  matchweekNumber,
  minuteLabel,
  pitchSpots,
  runningScores,
  shortPlayerName,
  statGroups,
  statRow,
} from '@/lib/match/match-view';

const HOME = 10;
const AWAY = 20;
let nextId = 1;
function ev(p: Partial<MatchEvent> & { minute: number; type: string }): MatchEvent {
  return {
    id: nextId++,
    extraMinute: null,
    detail: null,
    comments: null,
    teamId: HOME,
    player: { id: 1, name: { en: 'Player' } },
    assist: null,
    ...p,
  };
}

describe('eventKind / eventGroup', () => {
  it('classifies feed events', () => {
    expect(eventKind({ type: 'Goal', detail: 'Normal Goal' })).toBe('goal');
    expect(eventKind({ type: 'Goal', detail: 'Penalty' })).toBe('penaltyGoal');
    expect(eventKind({ type: 'Goal', detail: 'Own Goal' })).toBe('ownGoal');
    expect(eventKind({ type: 'Goal', detail: 'Missed Penalty' })).toBe('missedPenalty');
    expect(eventKind({ type: 'Card', detail: 'Yellow Card' })).toBe('yellowCard');
    expect(eventKind({ type: 'Card', detail: 'Second Yellow card' })).toBe('secondYellow');
    expect(eventKind({ type: 'Card', detail: 'Red Card' })).toBe('redCard');
    expect(eventKind({ type: 'subst', detail: 'Substitution 1' })).toBe('substitution');
    expect(eventKind({ type: 'Var', detail: 'Goal cancelled' })).toBe('var');
    expect(eventGroup('ownGoal')).toBe('goals');
    expect(eventGroup('missedPenalty')).toBe('goals');
    expect(eventGroup('secondYellow')).toBe('cards');
    expect(eventGroup('substitution')).toBe('subs');
    expect(eventGroup('var')).toBeNull();
  });
});

describe('minutes and ordering', () => {
  it('labels stoppage time and sorts 45+2 between 45 and 46', () => {
    const a = ev({ minute: 46, type: 'Goal' });
    const b = ev({ minute: 45, extraMinute: 2, type: 'Goal' });
    const c = ev({ minute: 45, type: 'Goal' });
    expect(minuteLabel(b)).toBe('45+2′');
    expect(minuteLabel(c)).toBe('45′');
    expect(chronological([a, b, c]).map((e) => e.id)).toEqual([c.id, b.id, a.id]);
  });
});

describe('runningScores', () => {
  it('credits every goal (own goals included) to event.teamId and skips shoot-out kicks', () => {
    const g1 = ev({ minute: 16, type: 'Goal', detail: 'Normal Goal', teamId: AWAY });
    const og = ev({ minute: 30, type: 'Goal', detail: 'Own Goal', teamId: HOME });
    const miss = ev({ minute: 50, type: 'Goal', detail: 'Missed Penalty', teamId: HOME });
    const g2 = ev({ minute: 70, type: 'Goal', detail: 'Penalty', teamId: AWAY });
    const so = ev({ minute: 120, type: 'Goal', detail: 'Penalty', comments: 'Penalty Shootout' });
    const s = runningScores([g2, og, g1, miss, so], HOME);
    expect(s.get(g1.id)).toEqual([0, 1]);
    expect(s.get(og.id)).toEqual([1, 1]);
    expect(s.get(g2.id)).toEqual([1, 2]);
    expect(s.has(miss.id)).toBe(false);
    expect(s.has(so.id)).toBe(false);
  });
});

describe('keyMoments', () => {
  it('keeps goals, missed penalties and cards, newest first', () => {
    const g = ev({ minute: 10, type: 'Goal', detail: 'Normal Goal' });
    const sub = ev({ minute: 20, type: 'subst', detail: 'Substitution 1' });
    const y = ev({ minute: 40, type: 'Card', detail: 'Yellow Card' });
    const m = ev({ minute: 60, type: 'Goal', detail: 'Missed Penalty' });
    expect(keyMoments([g, sub, y, m]).map((e) => e.id)).toEqual([m.id, y.id, g.id]);
  });
});

describe('stats', () => {
  const home = [
    { type: 'Total Shots', value: 12 },
    { type: 'Shots on Goal', value: 4 },
    { type: 'Ball Possession', value: '60%' },
    { type: 'Total passes', value: 500 },
    { type: 'Passes accurate', value: 450 },
  ];
  const away = [
    { type: 'Total Shots', value: 6 },
    { type: 'Ball Possession', value: '40%' },
    { type: 'Total passes', value: 300 },
    { type: 'Passes accurate', value: 240 },
  ];

  it('hides xG when the feed has none and treats a missing count as 0', () => {
    expect(statRow(home, away, 'xg', true)).toBeNull();
    const sot = statRow(home, away, 'shotsOnTarget', true)!;
    expect([sot.home, sot.away, sot.homeShare]).toEqual([4, 0, 1]);
    expect(statRow(home, away, 'corners', true)).toBeNull();
  });

  it('formats possession and derives pass accuracy', () => {
    expect(statRow(home, away, 'possession', false)!.homeText).toBe('60%');
    const pa = statRow(home, away, 'passAccuracy', false)!;
    expect([pa.homeText, pa.awayText]).toEqual(['90%', '80%']);
  });

  it('builds key stats and drops empty groups', () => {
    const h = { teamId: HOME, stats: home };
    const a = { teamId: AWAY, stats: away };
    expect(keyStatRows(h, a).map((r) => r.key)).toEqual([
      'totalShots',
      'shotsOnTarget',
      'possession',
    ]);
    const groups = statGroups(h, a);
    expect(groups.map((g) => g.id)).toEqual(['attack', 'passing']);
    expect(groups[0].rows.every((r) => r.bar)).toBe(true);
    expect(groups[1].rows.every((r) => !r.bar)).toBe(true);
  });

  it('keeps xG with two decimals when both sides have it', () => {
    const r = statRow(
      [{ type: 'expected_goals', value: '1.5' }],
      [{ type: 'expected_goals', value: '0.54' }],
      'xg',
      true,
    )!;
    expect([r.homeText, r.awayText]).toEqual(['1.50', '0.54']);
  });
});

describe('pitchSpots', () => {
  const p = (id: number, grid: string | null): LineupPlayer => ({
    id,
    name: `P ${id}`,
    number: id,
    pos: null,
    grid,
    photoUrl: null,
    birthDate: null,
  });

  it('puts the keeper at the bottom and the last line at the top (grid)', () => {
    const xi = [p(1, '1:1'), p(2, '2:1'), p(3, '2:2'), p(4, '3:1')];
    const s = pitchSpots(xi, '2-1');
    const gk = s.find((x) => x.player.id === 1)!;
    expect(gk.isKeeper).toBe(true);
    expect(gk.y).toBe(91);
    expect(gk.x).toBe(50);
    expect(s.find((x) => x.player.id === 4)!.y).toBe(9);
    expect(s.find((x) => x.player.id === 2)!.x).toBeCloseTo(33.33, 1);
  });

  it('falls back to the formation string, or gives up', () => {
    const xi = Array.from({ length: 11 }, (_, i) => p(i + 1, null));
    expect(pitchSpots(xi, '4-4-2')).toHaveLength(11);
    expect(pitchSpots(xi, '4-4')).toEqual([]);
    expect(pitchSpots(xi, null)).toEqual([]);
  });

  it('shortens names for the pitch labels', () => {
    expect(shortPlayerName('A. Maitland-Niles')).toBe('Maitland-Niles');
    expect(shortPlayerName('Pelé')).toBe('Pelé');
  });
});

describe('header / summary helpers', () => {
  it('reads the matchweek from league rounds only', () => {
    expect(matchweekNumber('Regular Season - 7')).toBe(7);
    expect(matchweekNumber('Round of 16')).toBeNull();
    expect(matchweekNumber(null)).toBeNull();
  });

  const base = {
    home: 'Arsenal',
    away: 'Chelsea',
    homeScore: 0,
    awayScore: 1,
    minute: 45,
    goals: [{ name: 'Palmer', minute: '16′', side: 'away' as const, ownGoal: false }],
    stats: {
      home: [
        { type: 'Ball Possession', value: '60%' },
        { type: 'Total Shots', value: 8 },
        { type: 'Shots on Goal', value: 2 },
      ],
      away: [
        { type: 'Ball Possession', value: '40%' },
        { type: 'Total Shots', value: 4 },
        { type: 'Shots on Goal', value: 1 },
      ],
    },
  };

  it('writes a half-time summary in en, fr and ar', () => {
    const en = matchSummary({ ...base, state: 'halfTime', locale: 'en' })!;
    expect(en).toContain('Chelsea lead 1–0 at Arsenal at the break.');
    expect(en).toContain('Goals: Palmer 16′.');
    expect(en).toContain('60%');
    expect(matchSummary({ ...base, state: 'halfTime', locale: 'fr' })).toContain('à la pause');
    expect(matchSummary({ ...base, state: 'halfTime', locale: 'ar' })).toContain('بين الشوطين');
  });

  it('writes a result at full time and nothing before kick-off', () => {
    expect(matchSummary({ ...base, state: 'finished', locale: 'en' })).toContain(
      'Chelsea won 1–0 at Arsenal.',
    );
    expect(matchSummary({ ...base, state: 'upcoming', locale: 'en' })).toBeNull();
    expect(
      matchSummary({ ...base, state: 'finished', locale: 'en', homeScore: 1, awayScore: 1 }),
    ).toContain('drew 1–1');
  });
});
