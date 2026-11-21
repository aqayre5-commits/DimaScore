import { describe, expect, it } from 'vitest';
import {
  buildLiveNarrative,
  buildMatchAnswer,
  buildMatchFaq,
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

  it('uses the article in en', () => {
    const recap = buildRecap({
      ...t,
      homeScore: 0,
      awayScore: 2,
      scorers,
      competition: 'Premier League',
      locale: 'en',
    });
    expect(recap).toBe(
      "Chelsea won 2–0 at Everton in the Premier League. Chelsea: Pedro Neto (46'), Pedro Neto (90'). Chelsea kept a clean sheet.",
    );
  });
});

describe('penalty shoot-outs are never worded as a draw', () => {
  // Everton 1–1 Chelsea, Chelsea win 5–4 on penalties (away win on pens).
  const base = { ...t, homeScore: 1, awayScore: 1, homePen: 4, awayPen: 5 };
  const expected: Record<string, string> = {
    en: 'Chelsea won 5–4 on penalties after a 1–1 draw at Everton',
    fr: "Chelsea s'est imposé 5–4 aux tirs au but à l'extérieur face à Everton, après un nul 1–1",
    ar: 'فاز Chelsea على Everton 5–4 بركلات الترجيح خارج أرضه بعد التعادل 1–1',
  };
  for (const locale of ['en', 'fr', 'ar']) {
    it(`penalty away win, ${locale}`, () => {
      expect(resultClause({ ...base, state: 'finished', locale })).toBe(expected[locale]);
      const recap = buildRecap({
        ...base,
        scorers: [
          { name: 'Calvert-Lewin', minute: 20, side: 'home', isPenalty: false, isOwnGoal: false },
          { name: 'Palmer', minute: 70, side: 'away', isPenalty: false, isOwnGoal: false },
        ],
        competition: 'FA Cup',
        locale,
      });
      const answer = buildMatchAnswer({
        ...base,
        state: 'finished',
        competition: 'FA Cup',
        kickoffLabel: 'x',
        locale,
      });
      const faq = buildMatchFaq({ ...base, state: 'finished', locale });
      for (const s of [recap, answer, faq[0].a]) {
        expect(s.startsWith(expected[locale])).toBe(true);
        expect(s).not.toMatch(/\bdrew\b|match nul|^تعادل/);
      }
    });
  }

  it('penalty home win, en', () => {
    expect(
      resultClause({
        ...t,
        state: 'finished',
        homeScore: 0,
        awayScore: 0,
        homePen: 3,
        awayPen: 1,
        locale: 'en',
      }),
    ).toBe('Everton beat Chelsea 3–1 on penalties after a 0–0 draw');
  });

  it('pens are ignored when the match was not level', () => {
    expect(
      resultClause({
        ...t,
        state: 'finished',
        homeScore: 0,
        awayScore: 2,
        homePen: 5,
        awayPen: 4,
        locale: 'en',
      }),
    ).toBe('Chelsea won 2–0 at Everton');
  });
});

describe('FAQ score answer: winner first, a draw names no winner', () => {
  const faq = (hs: number, as: number, locale: string) =>
    buildMatchFaq({ ...t, state: 'finished', homeScore: hs, awayScore: as, locale })[0].a;
  it('en', () => {
    expect(faq(0, 2, 'en')).toBe('Chelsea won 2–0 at Everton.');
    expect(faq(1, 1, 'en')).toBe('Everton and Chelsea drew 1–1.');
  });
  it('fr', () => {
    expect(faq(0, 2, 'fr')).toBe("Chelsea s'est imposé 2–0 à l'extérieur face à Everton.");
    expect(faq(1, 1, 'fr')).toBe('Everton et Chelsea ont fait match nul 1–1.');
  });
  it('ar', () => {
    expect(faq(0, 2, 'ar')).toBe('فاز Chelsea على Everton 2–0 خارج أرضه.');
    expect(faq(1, 1, 'ar')).toBe('تعادل Everton وChelsea 1–1.');
    expect(faq(1, 1, 'ar')).not.toContain('لصالح');
    expect(faq(2, 2, 'ar')).not.toContain('لصالح');
  });
});

describe('draws and away wins in the summary prose, en/fr/ar', () => {
  const draw: Record<string, string> = {
    en: 'Everton and Chelsea drew 1–1',
    fr: 'Everton et Chelsea ont fait match nul 1–1',
    ar: 'تعادل Everton وChelsea 1–1',
  };
  for (const locale of ['en', 'fr', 'ar']) {
    it(`draw, ${locale}`, () => {
      const recap = buildRecap({
        ...t,
        homeScore: 1,
        awayScore: 1,
        scorers: [],
        competition: 'X',
        locale,
      });
      const answer = buildMatchAnswer({
        ...t,
        state: 'finished',
        homeScore: 1,
        awayScore: 1,
        competition: 'X',
        kickoffLabel: 'x',
        locale,
      });
      for (const s of [recap, answer]) {
        expect(s.startsWith(draw[locale])).toBe(true);
        expect(s).not.toContain('لصالح');
      }
    });
  }
});
