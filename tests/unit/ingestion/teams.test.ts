import { describe, it, expect } from 'vitest';
import { mapVenueToInsert, mapTeamToInsert } from '@/lib/ingestion/teams';
import type { NormalizedTeam, NormalizedVenue } from '@/lib/data/types';

const venue: NormalizedVenue = {
  id: 100,
  name: 'Mohammed V Stadium',
  city: 'Casablanca',
  country: 'Morocco',
  capacity: 67000,
  image: 'https://img.io/moh5.jpg',
};

describe('mapVenueToInsert', () => {
  it('maps all venue fields', () => {
    const result = mapVenueToInsert(venue);
    expect(result).toEqual({
      id: 100,
      name: 'Mohammed V Stadium',
      city: 'Casablanca',
      countryCode: 'Morocco',
      capacity: 67000,
      imageUrl: 'https://img.io/moh5.jpg',
    });
  });
});

describe('mapTeamToInsert', () => {
  const team: NormalizedTeam = {
    id: 968,
    name: 'Wydad AC',
    code: 'WAC',
    logo: 'https://logo.io/wac.png',
    country: 'Morocco',
    founded: 1937,
    national: false,
    venue,
  };

  it('maps team fields with slug', () => {
    const result = mapTeamToInsert(team, false);
    expect(result.id).toBe(968);
    expect(result.slug).toBe('wydad-ac');
    expect(result.name).toEqual({ en: 'Wydad AC' });
    expect(result.shortName).toEqual({ en: 'WAC' });
    expect(result.code).toBe('WAC');
    expect(result.countryCode).toBe('Morocco');
    expect(result.founded).toBe(1937);
    expect(result.venueId).toBe(100);
    expect(result.isNational).toBe(false);
    expect(result.isWomen).toBe(false);
  });

  it('sets isWomen from params', () => {
    const result = mapTeamToInsert(team, true);
    expect(result.isWomen).toBe(true);
  });

  it('uses name as shortName when code is null', () => {
    const noCode: NormalizedTeam = { ...team, code: null };
    const result = mapTeamToInsert(noCode, false);
    expect(result.shortName).toEqual({ en: 'Wydad AC' });
  });

  it('sets venueId to null when venue is missing', () => {
    const noVenue: NormalizedTeam = { ...team, venue: null };
    const result = mapTeamToInsert(noVenue, false);
    expect(result.venueId).toBeNull();
  });

  it('sets isNational for national teams', () => {
    const national: NormalizedTeam = { ...team, national: true };
    const result = mapTeamToInsert(national, false);
    expect(result.isNational).toBe(true);
  });
});
