import { describe, expect, it } from 'vitest';
import {
  buildLiveNarrative,
  buildMatchAnswer,
  buildRecap,
  resultClause,
} from '@/lib/seo/match-narrative';

const t = { home: 'Everton', away: 'Chelsea' };

describe('resultClause: the leading side’s score comes first', () => {
  it('finished, en', () => {
    const r = (hs: number, as: number) =>
      resultClause({ ...t, state: 'finished', homeScore: hs, awayScore: as, locale: 'en' });
    expect(r(0, 2)).toBe('Chelsea won 2–0 at Everton');
    expect(r(3, 1)).toBe('Everton beat Chelsea 3–1');
    expect(r(1, 1)).toBe('Everton and Chelsea drew 1–1');
  });

  it('finished, fr and ar', () => {
    const fr = (hs: number, as: number) =>
      resultClause({ ...t, state: 'finished', homeScore: hs, awayScore: as, locale: 'fr' });
    expect(fr(0, 2)).toBe("Chelsea s'est imposé 2–0 à l'extérieur face à Everton");
    expect(fr(2, 1)).toBe('Everton a battu Chelsea 2–1');
    expect(fr(0, 0)).toBe('Everton et Chelsea ont fait match nul 0–0');
    const ar = (hs: number, as: number) =>
      resultClause({ ...t, state: 'finished', homeScore: hs, awayScore: as, locale: 'ar' });
    expect(ar(0, 2)).toBe('فاز Chelsea على Everton 2–0 خارج أرضه');
    expect(ar(2, 0)).toBe('فاز Everton على Chelsea 2–0');
    expect(ar(1, 1)).toBe('تعادل Everton وChelsea 1–1');
  });

  it('live', () => {
    const r = (hs: number, as: number, locale: string) =>
      resultClause({ ...t, state: 'live', homeScore: hs, awayScore: as, locale });
    expect(r(0, 1, 'en')).toBe('Chelsea lead 1–0 at Everton');
    expect(r(2, 1, 'en')).toBe('Everton lead Chelsea 2–1');
    expect(r(1, 1, 'en')).toBe('Everton and Chelsea are level at 1–1');
    expect(r(0, 1, 'fr')).toBe("Chelsea mène 1–0 à l'extérieur face à Everton");
    expect(r(0, 1, 'ar')).toBe('Chelsea يتقدّم 1–0 خارج أرضه أمام Everton');
  });
});

describe('match prose never puts the loser’s score first', () => {
  const scorers = [
    { name: 'Pedro Neto', minute: 46, side: 'away' as const, isPenalty: false, isOwnGoal: false },
    { name: 'Pedro Neto', minute: 90, side: 'away' as const, isPenalty: false, isOwnGoal: false },
  ];
  for (const locale of ['en', 'fr', 'ar']) {
    it(`away win, ${locale}`, () => {
      const answer = buildMatchAnswer({
        ...t,
        state: 'finished',
        homeScore: 0,
        awayScore: 2,
        competition: 'Premier League',
        kickoffLabel: 'x',
        locale,
      });
      const recap = buildRecap({
        ...t,
        homeScore: 0,
        awayScore: 2,
        scorers,
        competition: 'Premier League',
        locale,
      });
      const live = buildLiveNarrative({
        ...t,
        homeScore: 0,
        awayScore: 2,
        scorers,
        minute: 60,
        competition: 'Premier League',
        locale,
      });
      for (const s of [answer, recap, live]) {
        expect(s).not.toContain('0–2');
        expect(s).toContain('2–0');
      }
    });
  }

  it('groups a player’s goals and uses the article in en', () => {
    const recap = buildRecap({
      ...t,
      homeScore: 0,
      awayScore: 2,
      scorers,
      competition: 'Premier League',
      locale: 'en',
    });
    expect(recap).toBe(
      "Chelsea won 2–0 at Everton in the Premier League. Chelsea: Pedro Neto (46', 90'). Chelsea kept a clean sheet.",
    );
  });
});
