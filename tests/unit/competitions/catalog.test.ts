import { describe, it, expect } from 'vitest';
import { VERIFIED_COMPETITIONS } from '@/lib/constants/competitions';
import { ALL_ENTRIES, findEntryByCompetitionId } from '@/lib/constants/competitions-mega-menu';
import { getCompetitionFormat } from '@/lib/competitions/formats';
import { KNOCKOUT_ROUND_NAMES } from '@/lib/ingestion/round';
import { chunkIds } from '@/lib/ingestion/chunk';

/** D1 (rollout stays): Tier A newcomers + Morocco-relevant youth / women's / Olympic. */
const D1_NEW_IDS = [
  4, 960, 9, 15, 143, 45, 538, 973, 1015, 953, 8, 480, 524, 490, 587, 920, 950,
];

describe('D1 catalog', () => {
  it('registers every D1 competition id in VERIFIED_COMPETITIONS and the mega menu', () => {
    const verified = new Set(VERIFIED_COMPETITIONS.map((c) => c.id));
    const menu = new Set(ALL_ENTRIES.map((e) => e.competitionId));
    for (const id of D1_NEW_IDS) {
      expect(verified.has(id)).toBe(true);
      expect(menu.has(id)).toBe(true);
      expect(findEntryByCompetitionId(id)?.slugs.en).toBeTruthy();
      expect(getCompetitionFormat(id)).not.toBeNull();
    }
  });

  it('does not duplicate verified ids', () => {
    const ids = VERIFIED_COMPETITIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('knockout round names', () => {
  it('includes Knockout Round Play-offs and 8th/16th Finals', () => {
    expect(KNOCKOUT_ROUND_NAMES).toContain('Knockout Round Play-offs');
    expect(KNOCKOUT_ROUND_NAMES).toContain('8th Finals');
    expect(KNOCKOUT_ROUND_NAMES).toContain('16th Finals');
  });
});

describe('chunkIds', () => {
  it('batches fixture ids in groups of 20', () => {
    const ids = Array.from({ length: 45 }, (_, i) => i + 1);
    const chunks = chunkIds(ids);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(20);
    expect(chunks[1]).toHaveLength(20);
    expect(chunks[2]).toHaveLength(5);
  });
});
