import { describe, expect, it } from 'vitest';
import { CLUB_NAMES, localizedTeamName } from '@/lib/constants/team-names-i18n';
import snapshot from './fixtures/moroccan-club-teams.json';

// Each CLUB_NAMES id must be the club its Arabic/French name belongs to. The fixture holds the
// stored teams rows (id, slug, name.en) for those ids; scripts/check-club-names.ts runs the same
// check against a live database.
const stored = snapshot.teams as Record<string, { slug: string; en: string }>;
const ids = Object.keys(CLUB_NAMES).map(Number);

describe('CLUB_NAMES ids match the stored teams', () => {
  it('has a stored team row for every id, and no extras', () => {
    expect(
      Object.keys(stored)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual([...ids].sort((a, b) => a - b));
  });

  it.each(ids)('id %i: pinned English name equals the stored name.en', (id) => {
    expect(stored[id]?.en).toBe(CLUB_NAMES[id].en);
    expect(stored[id]?.slug.endsWith(`-${id}`)).toBe(true);
  });

  it('pins the two Casablanca clubs to the right ids', () => {
    expect(stored[976].en).toBe('Raja Casablanca');
    expect(localizedTeamName({ id: 976, name: { en: 'Raja Casablanca' } }, 'ar')).toBe(
      'الرجاء الرياضي',
    );
    expect(stored[968].en).toBe('Wydad AC');
    expect(localizedTeamName({ id: 968, name: { en: 'Wydad AC' } }, 'ar')).toBe('الوداد الرياضي');
  });

  it('never gives two ids the same Arabic or French name', () => {
    for (const locale of ['ar', 'fr'] as const) {
      const names = ids.map((id) => CLUB_NAMES[id][locale]).filter(Boolean);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});
