import { describe, expect, it } from 'vitest';
import { lineupState, type LineupStateInput } from '@/lib/match/lineup-state';

const xi = (grids: Array<string | null>, formation: string | null = '4-3-3'): LineupStateInput => ({
  formation,
  starters: grids.map((grid) => ({ grid })),
  substitutes: [{ id: 1 }],
});

const eleven = (grid = '1:1'): string[] =>
  Array.from({ length: 11 }, (_, i) => (i === 0 ? '1:1' : `2:${i}`));

describe('lineupState', () => {
  it('is none when there are no lineups, or only one side has players', () => {
    expect(lineupState(null)).toBe('none');
    expect(lineupState(undefined)).toBe('none');
    expect(lineupState([])).toBe('none');
    expect(lineupState([{ formation: '4-3-3', starters: [], substitutes: [] }])).toBe('none');
    expect(lineupState([xi(eleven())])).toBe('none');
  });

  it('is list when both sides have players but a side lacks a formation', () => {
    expect(lineupState([xi(eleven(), null), xi(eleven(), '4-4-2')])).toBe('list');
    expect(lineupState([xi(eleven(), '  '), xi(eleven(), '4-4-2')])).toBe('list');
    expect(
      lineupState([
        { formation: null, starters: [{ grid: null }], substitutes: [] },
        { formation: null, starters: [], substitutes: [{ id: 2 }] },
      ]),
    ).toBe('list');
  });

  it('is list when not every starter has a usable grid', () => {
    const incomplete = eleven();
    incomplete[4] = null as unknown as string;
    expect(lineupState([xi(incomplete), xi(eleven())])).toBe('list');
    expect(lineupState([xi([...eleven().slice(0, 10), 'A:B']), xi(eleven())])).toBe('list');
    expect(lineupState([xi([...eleven().slice(0, 10), '1-2']), xi(eleven())])).toBe('list');
    expect(lineupState([xi([...eleven().slice(0, 10), '']), xi(eleven())])).toBe('list');
  });

  it('is full when both sides have a formation and every starter has a grid', () => {
    expect(lineupState([xi(eleven('1:1'), '4-3-3'), xi(eleven('1:1'), '4-2-3-1')])).toBe('full');
  });

  it('treats a fixture like 1651745 (formation and grids, some starter ids missing) as full', () => {
    // Verified against stored rows: both sides have a shape and every starter has a line:column grid.
    const home = {
      formation: '4-2-3-1',
      starters: ['1:1', '2:4', '2:3', '2:2', '2:1', '3:2', '3:1', '4:3', '4:2', '4:1', '5:1'].map(
        (grid) => ({ grid, id: null }),
      ),
      substitutes: Array.from({ length: 8 }, () => ({ id: null })),
    };
    const away = {
      formation: '4-3-3',
      starters: ['1:1', '2:4', '2:3', '2:2', '2:1', '3:3', '3:2', '3:1', '4:3', '4:2', '4:1'].map(
        (grid) => ({ grid, id: null }),
      ),
      substitutes: Array.from({ length: 8 }, () => ({ id: null })),
    };
    expect(lineupState([home, away])).toBe('full');
  });
});
