import { describe, expect, it } from 'vitest';
import { isDisplayableFixture } from '@/lib/db/queries/homepage';
import { isHomeDisplayableFixture } from '@/lib/home/displayable';
import type { TeamSnapshot } from '@/lib/db/queries-hydrate';

function team(p: Partial<TeamSnapshot> & Pick<TeamSnapshot, 'id' | 'name'>): TeamSnapshot {
  return {
    slug: `t${p.id}`,
    shortName: p.shortName ?? {},
    code: p.code ?? null,
    countryCode: p.countryCode ?? null,
    logoUrl: null,
    isNational: p.isNational ?? false,
    ...p,
  };
}

const moroccoU23 = team({ id: 1, name: { en: 'Morocco U23' }, shortName: { en: 'MAR U23' } });
const egyptU23 = team({ id: 2, name: { en: 'Egypt U23' }, shortName: { en: 'EGY U23' } });
const morocco = team({
  id: 3,
  name: { en: 'Morocco' },
  shortName: { en: 'MAR' },
  isNational: true,
});
const spain = team({ id: 4, name: { en: 'Spain' }, shortName: { en: 'ESP' }, isNational: true });
const wydad = team({ id: 5, name: { en: 'Wydad AC' }, shortName: { en: 'WAC' } });

const FRIENDLIES = { id: 10 };

describe('isHomeDisplayableFixture', () => {
  it('shows youth matches, youth friendlies included', () => {
    // Home's gate does not look at the competition, so a U23 friendly and a U23
    // tournament fixture are treated the same: both are shown.
    expect(isHomeDisplayableFixture({ homeTeam: moroccoU23, awayTeam: egyptU23 })).toBe(true);
    expect(isHomeDisplayableFixture({ homeTeam: moroccoU23, awayTeam: wydad })).toBe(true);
    expect(isHomeDisplayableFixture({ homeTeam: morocco, awayTeam: spain })).toBe(true);
  });

  it('hides a match when a team is missing, TBD, unknown, or has no name', () => {
    const cases: Array<{ homeTeam: TeamSnapshot | null; awayTeam: TeamSnapshot | null }> = [
      { homeTeam: null, awayTeam: wydad },
      { homeTeam: wydad, awayTeam: null },
      { homeTeam: team({ id: 10, name: { en: 'TBD' } }), awayTeam: wydad },
      {
        homeTeam: wydad,
        awayTeam: team({ id: 11, name: { en: 'tbd' }, shortName: { en: 'TBD' } }),
      },
      { homeTeam: team({ id: 12, name: { en: 'Unknown' } }), awayTeam: wydad },
      {
        homeTeam: wydad,
        awayTeam: team({ id: 13, name: { en: 'unknown' }, shortName: { en: 'N/A' } }),
      },
      { homeTeam: team({ id: 14, name: {} }), awayTeam: wydad },
      { homeTeam: wydad, awayTeam: team({ id: 15, name: { en: '' }, shortName: { fr: '   ' } }) },
      { homeTeam: team({ id: 16, name: { en: '  ' }, code: 'ABC' }), awayTeam: wydad },
    ];
    for (const f of cases) {
      expect(isHomeDisplayableFixture(f), JSON.stringify(f)).toBe(false);
    }
  });

  it('keeps a side that has a real name even if another locale is a placeholder', () => {
    expect(
      isHomeDisplayableFixture({
        homeTeam: team({ id: 20, name: { en: 'TBD', fr: 'Wydad AC' } }),
        awayTeam: wydad,
      }),
    ).toBe(true);
  });
});

describe('isDisplayableFixture (ticker / old homepage, unchanged)', () => {
  it('still hides youth sides in the Friendlies feed', () => {
    expect(
      isDisplayableFixture({
        competition: FRIENDLIES,
        homeTeam: moroccoU23,
        awayTeam: egyptU23,
      }),
    ).toBe(false);
    expect(
      isDisplayableFixture({
        competition: FRIENDLIES,
        homeTeam: morocco,
        awayTeam: spain,
      }),
    ).toBe(true);
  });
});
