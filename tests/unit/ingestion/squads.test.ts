import { describe, it, expect } from 'vitest';
import { mapSquadPlayerToInsert } from '@/lib/ingestion/squads';
import type { NormalizedSquadPlayer } from '@/lib/data/types';

describe('mapSquadPlayerToInsert', () => {
  const player: NormalizedSquadPlayer = {
    id: 9,
    name: 'A. Hakimi',
    age: 27,
    number: 2,
    position: 'Defender',
    photo: 'https://img.io/hakimi.png',
  };

  it('maps all fields', () => {
    const result = mapSquadPlayerToInsert(player, 31, false);
    expect(result.id).toBe(9);
    expect(result.slug).toBe('a-hakimi-9');
    expect(result.name).toEqual({ en: 'A. Hakimi' });
    expect(result.photoUrl).toBe('https://img.io/hakimi.png');
    expect(result.currentTeamId).toBe(31);
    expect(result.position).toBe('Defender');
    expect(result.shirtNumber).toBe(2);
    expect(result.isWomen).toBe(false);
  });

  it('sets isWomen for women players', () => {
    const result = mapSquadPlayerToInsert(player, 14461, true);
    expect(result.isWomen).toBe(true);
    expect(result.currentTeamId).toBe(14461);
  });

  it('handles null number', () => {
    const noNumber: NormalizedSquadPlayer = { ...player, number: null };
    const result = mapSquadPlayerToInsert(noNumber, 31, false);
    expect(result.shirtNumber).toBeNull();
  });

  it('handles null position', () => {
    const noPos: NormalizedSquadPlayer = { ...player, position: null };
    const result = mapSquadPlayerToInsert(noPos, 31, false);
    expect(result.position).toBeNull();
  });
});
