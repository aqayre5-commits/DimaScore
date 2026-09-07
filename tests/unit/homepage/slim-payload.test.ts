import { describe, expect, it } from 'vitest';
import { isPrimaryHomeFixture, slimHomeFixture } from '@/lib/homepage/slim-payload';
import type { HomeFixture } from '@/lib/db/queries/homepage';

function fixture(partial: Partial<HomeFixture> & Pick<HomeFixture, 'id'>): HomeFixture {
  return {
    kickoffAt: new Date('2026-09-07T19:00:00.000Z'),
    statusCode: 'NS',
    minute: null,
    round: null,
    groupLabel: null,
    contextLabel: null,
    isFeatured: false,
    featureTag: null,
    homeTeamId: 1,
    awayTeamId: 2,
    homeScore: null,
    awayScore: null,
    homeScorePen: null,
    awayScorePen: null,
    homeTeam: {
      id: 1,
      slug: 'wydad',
      name: { en: 'Wydad', fr: 'Wydad', ar: 'الوداد' },
      shortName: { en: 'WAC', fr: 'WAC', ar: 'الوداد' },
      code: 'WAC',
      countryCode: 'MA',
      logoUrl: 'https://media.api-sports.io/football/teams/1.png',
      isNational: false,
    },
    awayTeam: {
      id: 2,
      slug: 'raja',
      name: { en: 'Raja', fr: 'Raja', ar: 'الرجاء' },
      shortName: { en: 'RCA', fr: 'RCA', ar: 'الرجاء' },
      code: 'RCA',
      countryCode: 'MA',
      logoUrl: 'https://media.api-sports.io/football/teams/2.png',
      isNational: false,
    },
    competition: {
      id: 200,
      name: { en: 'Botola Pro', fr: 'Botola Pro', ar: 'البطولة الاحترافية' },
      slug: 'botola-pro',
      countryCode: 'MA',
      logoUrl: 'https://media.api-sports.io/football/leagues/200.png',
      displayPriority: 1,
    },
    venueName: 'Stadium',
    venueCity: 'Casablanca',
    venueCapacity: 45000,
    ...partial,
  };
}

describe('slimHomeFixture', () => {
  it('drops remote crest URLs and unused venue fields', () => {
    const slim = slimHomeFixture(fixture({ id: 10 }), 'fr');
    expect(slim.homeTeam?.logoUrl).toBeNull();
    expect(slim.awayTeam?.logoUrl).toBeNull();
    expect(slim.competition.logoUrl).toBeNull();
    expect(slim.venueName).toBeNull();
    expect(slim.venueCapacity).toBeNull();
    expect(slim.homeTeam?.name).toEqual({ fr: 'Wydad', en: 'Wydad' });
    expect(slim.homeTeam?.name.ar).toBeUndefined();
  });
});

describe('isPrimaryHomeFixture', () => {
  it('keeps Botola and Moroccan-club matches', () => {
    expect(isPrimaryHomeFixture(fixture({ id: 1 }))).toBe(true);
  });

  it('drops a foreign league with no Moroccan side', () => {
    const pl = fixture({
      id: 2,
      homeTeam: {
        id: 50,
        slug: 'arsenal',
        name: { en: 'Arsenal' },
        shortName: { en: 'ARS' },
        code: 'ARS',
        countryCode: 'GB',
        logoUrl: null,
        isNational: false,
      },
      awayTeam: {
        id: 33,
        slug: 'united',
        name: { en: 'Man United' },
        shortName: { en: 'MUN' },
        code: 'MUN',
        countryCode: 'GB',
        logoUrl: null,
        isNational: false,
      },
      competition: {
        id: 39,
        name: { en: 'Premier League' },
        slug: 'premier-league',
        countryCode: 'GB',
        logoUrl: null,
        displayPriority: 10,
      },
    });
    expect(isPrimaryHomeFixture(pl)).toBe(false);
  });
});
