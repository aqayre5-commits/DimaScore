import { describe, expect, it } from 'vitest';
import {
  filterHome,
  groupByCompetition,
  pickComingUp,
  pickHero,
  pickStandingsLeague,
  rankFrom,
  shiftDayKey,
  type HomeFixture,
} from '@/lib/home/model';

const team = (id: number) => ({
  id,
  slug: `t${id}`,
  name: { en: `Team ${id}` },
  shortName: { en: `T${id}` },
  code: null,
  countryCode: null,
  logoUrl: null,
  isNational: false,
});

let seq = 1;
function fx(p: Partial<HomeFixture> & { kickoffAt: Date; competitionId: number }): HomeFixture {
  const id = p.id ?? seq++;
  return {
    id,
    round: null,
    roundNumber: null,
    statusCode: 'NS',
    homeTeamId: id * 10,
    awayTeamId: id * 10 + 1,
    homeScore: null,
    awayScore: null,
    homeScoreHt: null,
    awayScoreHt: null,
    homeScorePen: null,
    awayScorePen: null,
    venueId: null,
    venue: null,
    homeTeam: team(id * 10),
    awayTeam: team(id * 10 + 1),
    seasonYear: 2026,
    minute: null,
    ...p,
  };
}

const NOW = new Date('2026-11-26T15:00:00Z');
const at = (iso: string) => new Date(iso);
const none = { starred: new Set<number>(), pinned: new Set<number>() };
const rank = rankFrom([200, 39, 140]);

describe('home model', () => {
  it('shifts day keys across month ends', () => {
    expect(shiftDayKey('2026-11-30', 1)).toBe('2026-12-01');
    expect(shiftDayKey('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('leads with a live match, preferring starred, then pinned, then editorial order', () => {
    const a = fx({ competitionId: 140, statusCode: '2H', kickoffAt: at('2026-11-26T14:00:00Z') });
    const b = fx({ competitionId: 39, statusCode: '1H', kickoffAt: at('2026-11-26T14:30:00Z') });
    const c = fx({ competitionId: 999, statusCode: '1H', kickoffAt: at('2026-11-26T14:40:00Z') });
    const up = fx({ competitionId: 200, kickoffAt: at('2026-11-26T18:00:00Z') });
    expect(pickHero([a, b, c, up], NOW, none, rank)?.id).toBe(b.id);
    expect(
      pickHero([a, b, c], NOW, { starred: new Set([c.id]), pinned: new Set() }, rank)?.id,
    ).toBe(c.id);
    expect(pickHero([a, b, c], NOW, { starred: new Set(), pinned: new Set([140]) }, rank)?.id).toBe(
      a.id,
    );
  });

  it('falls back to the next kick-off, then the latest result', () => {
    const done1 = fx({
      competitionId: 39,
      statusCode: 'FT',
      kickoffAt: at('2026-11-26T10:00:00Z'),
    });
    const done2 = fx({
      competitionId: 39,
      statusCode: 'FT',
      kickoffAt: at('2026-11-26T12:00:00Z'),
    });
    const later = fx({ competitionId: 999, kickoffAt: at('2026-11-26T20:00:00Z') });
    const soon = fx({ competitionId: 999, kickoffAt: at('2026-11-26T17:00:00Z') });
    expect(pickHero([done1, done2, later, soon], NOW, none, rank)?.id).toBe(soon.id);
    expect(pickHero([done1, done2], NOW, none, rank)?.id).toBe(done2.id);
    expect(pickHero([], NOW, none, rank)).toBeNull();
  });

  it('picks one upcoming card for the day and one for the following matchday', () => {
    const hero = fx({ competitionId: 39, kickoffAt: at('2026-11-26T17:00:00Z') });
    const today = fx({ competitionId: 61, kickoffAt: at('2026-11-26T19:00:00Z') });
    const today2 = fx({ competitionId: 61, kickoffAt: at('2026-11-26T21:00:00Z') });
    const next = fx({ competitionId: 140, kickoffAt: at('2026-11-28T19:00:00Z') });
    const cards = pickComingUp([hero, today, today2, next], '2026-11-26', hero.id, NOW);
    expect(cards.map((f) => f.id)).toEqual([today.id, next.id]);
    expect(pickComingUp([hero], '2026-11-26', hero.id, NOW)).toEqual([]);
  });

  it('groups every competition, pinned first, then editorial order, then priority', () => {
    const f1 = fx({ competitionId: 10, kickoffAt: at('2026-11-26T12:00:00Z') });
    const f2 = fx({ competitionId: 39, kickoffAt: at('2026-11-26T13:00:00Z') });
    const f3 = fx({ competitionId: 500, kickoffAt: at('2026-11-26T11:00:00Z') });
    const f4 = fx({ competitionId: 200, kickoffAt: at('2026-11-26T14:00:00Z') });
    const prio = (id: number) => (id === 500 ? 1 : 50);
    const ids = (pinned: Set<number>) =>
      groupByCompetition([f1, f2, f3, f4], pinned, rank, prio).map((g) => g.competitionId);
    expect(ids(new Set())).toEqual([200, 39, 500, 10]);
    expect(ids(new Set([10]))).toEqual([10, 200, 39, 500]);
  });

  it('filters by status without dropping competitions from All', () => {
    const live = fx({ competitionId: 10, statusCode: '1H', kickoffAt: at('2026-11-26T14:30:00Z') });
    const up = fx({ competitionId: 39, kickoffAt: at('2026-11-26T18:00:00Z') });
    const ft = fx({ competitionId: 61, statusCode: 'FT', kickoffAt: at('2026-11-26T11:00:00Z') });
    const all = [live, up, ft];
    expect(filterHome(all, 'all', NOW)).toHaveLength(3);
    expect(filterHome(all, 'live', NOW).map((f) => f.id)).toEqual([live.id]);
    expect(filterHome(all, 'upcoming', NOW).map((f) => f.id)).toEqual([up.id]);
    expect(filterHome(all, 'finished', NOW).map((f) => f.id)).toEqual([ft.id]);
  });

  it('defaults the standings to a league with a live match', () => {
    const live = fx({ competitionId: 39, statusCode: '2H', kickoffAt: at('2026-11-26T14:00:00Z') });
    const up = fx({ competitionId: 140, kickoffAt: at('2026-11-26T18:00:00Z') });
    expect(pickStandingsLeague([200, 140, 39], [live, up], NOW)).toBe(39);
    expect(pickStandingsLeague([200, 140, 39], [up], NOW)).toBe(140);
    expect(pickStandingsLeague([200, 140], [], NOW)).toBe(200);
  });
});
