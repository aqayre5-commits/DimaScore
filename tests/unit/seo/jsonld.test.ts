import { describe, expect, it } from 'vitest';
import {
  buildFixtureItemList,
  buildGraph,
  buildSportsEventMatch,
  buildWebSite,
  sportsEventStatus,
} from '@/lib/seo/jsonld';

const base = 'https://dimascore.ma';
const SCHEDULED = 'https://schema.org/EventScheduled';

describe('sportsEventStatus', () => {
  it('uses only schema.org EventStatusType values', () => {
    // Played, awarded and walkover took place as scheduled. EventCompleted is not in the enum.
    for (const code of ['FT', 'AET', 'PEN', 'AWD', 'WO', 'NS', 'TBD', '1H', 'SUSP']) {
      expect(sportsEventStatus(code)).toBe(SCHEDULED);
    }
    expect(sportsEventStatus('PST')).toBe('https://schema.org/EventPostponed');
    expect(sportsEventStatus('CANC')).toBe('https://schema.org/EventCancelled');
    expect(sportsEventStatus('ABD')).toBe('https://schema.org/EventCancelled');
    expect(JSON.stringify(Object.values({ FT: sportsEventStatus('FT') }))).not.toContain(
      'EventCompleted',
    );
  });
});

describe('buildSportsEventMatch', () => {
  it('keeps the language url and the visible heading, and does not invent a score', () => {
    const url = `${base}/en/match/netherlands-germany-1528862`;
    const node = buildSportsEventMatch({
      url,
      name: 'Netherlands 1–1 Germany — UEFA Nations League',
      homeName: 'Netherlands',
      awayName: 'Germany',
      competitionName: 'UEFA Nations League',
      kickoffAt: new Date('2026-09-24T18:45:00.000Z'),
      statusCode: 'FT',
    });
    expect(node.url).toBe(url);
    expect(node['@id']).toBe(`${url}#event`);
    expect(node.name).toBe('Netherlands 1–1 Germany — UEFA Nations League');
    expect(node.eventStatus).toBe(SCHEDULED);
    expect(node).not.toHaveProperty('homeScore');
    expect(node).not.toHaveProperty('awayScore');
    expect(JSON.stringify(node)).not.toContain('EventCompleted');
  });

  it('keeps an upcoming match on its language url', () => {
    const url = `${base}/ar/match/netherlands-germany-1528862`;
    const node = buildSportsEventMatch({
      url,
      name: 'هولندا ضد ألمانيا — دوري الأمم الأوروبية',
      homeName: 'هولندا',
      awayName: 'ألمانيا',
      competitionName: 'دوري الأمم الأوروبية',
      kickoffAt: new Date('2026-11-20T18:00:00.000Z'),
      statusCode: 'NS',
    });
    expect(node.url).toBe(url);
    expect(node.eventStatus).toBe(SCHEDULED);
    expect(node).not.toHaveProperty('homeScore');
    expect(node).not.toHaveProperty('awayScore');
  });

  it('marks a postponed match as EventPostponed', () => {
    const node = buildSportsEventMatch({
      url: `${base}/fr/match/example-1`,
      homeName: 'Raja',
      awayName: 'Wydad',
      competitionName: 'Botola Pro',
      kickoffAt: new Date('2026-11-01T18:00:00.000Z'),
      statusCode: 'PST',
    });
    expect(node.eventStatus).toBe('https://schema.org/EventPostponed');
    expect(node).not.toHaveProperty('homeScore');
  });
});

describe('buildSportsEventMatch: Event rich-result fields, only what the page shows', () => {
  const url = `${base}/ar/match/manchester-city-fulham-1379071`;
  const node = buildSportsEventMatch({
    url,
    locale: 'ar',
    name: 'مانشستر سيتي ضد فولهام — الدوري الإنجليزي الممتاز',
    description: 'فولهام يتقدم 1–0 على مانشستر سيتي بين الشوطين.',
    homeName: 'مانشستر سيتي',
    awayName: 'فولهام',
    homeLogo: 'https://media.api-sports.io/football/teams/50.png',
    awayLogo: 'https://media.api-sports.io/football/teams/36.png',
    homeUrl: `${base}/ar/equipe/manchester-city-50`,
    awayUrl: `${base}/ar/equipe/fulham-36`,
    competitionName: 'الدوري الإنجليزي الممتاز',
    kickoffAt: new Date('2026-11-21T15:00:00.000Z'),
    statusCode: 'HT',
    venueName: 'Etihad Stadium',
    venueCity: 'Manchester',
  });

  it('has location with a PostalAddress, image, performer, home/away teams', () => {
    expect(node.location).toEqual({
      '@type': 'Place',
      name: 'Etihad Stadium',
      address: { '@type': 'PostalAddress', addressLocality: 'Manchester' },
    });
    expect(node.eventAttendanceMode).toBe('https://schema.org/OfflineEventAttendanceMode');
    expect(node.image).toHaveLength(2);
    expect(node.homeTeam).toEqual({ '@id': `${url}#home-team` });
    expect(node.awayTeam).toEqual({ '@id': `${url}#away-team` });
    expect(node.performer).toEqual([
      { '@type': 'SportsTeam', '@id': `${url}#home-team`, name: 'مانشستر سيتي' },
      { '@type': 'SportsTeam', '@id': `${url}#away-team`, name: 'فولهام' },
    ]);
    const competitors = node.competitor as Array<Record<string, unknown>>;
    expect(competitors.map((c) => c.name)).toEqual(['مانشستر سيتي', 'فولهام']);
    expect(competitors[1].url).toBe(`${base}/ar/equipe/fulham-36`);
    expect(node.description).toContain('فولهام');
  });

  it('uses the 1200x630 share image as the event image when given', () => {
    const og = `${url}/opengraph-image-2z6s0d`;
    const n = buildSportsEventMatch({
      url,
      locale: 'ar',
      image: og,
      homeName: 'مانشستر سيتي',
      awayName: 'فولهام',
      homeLogo: 'https://media.api-sports.io/football/teams/50.png',
      competitionName: 'الدوري الإنجليزي الممتاز',
      kickoffAt: new Date('2026-11-21T15:00:00.000Z'),
      statusCode: 'FT',
    });
    expect(n.image).toEqual([og]);
    // The crest stays on the team node.
    const competitors = n.competitor as Array<Record<string, unknown>>;
    expect(competitors[0].logo).toBe('https://media.api-sports.io/football/teams/50.png');
  });

  it('adds nothing we do not have, and no score', () => {
    for (const k of ['organizer', 'offers', 'endDate', 'homeScore', 'awayScore']) {
      expect(node).not.toHaveProperty(k);
    }
  });

  it('defaults the name to the page-language connector, never "vs" on /ar', () => {
    const n = buildSportsEventMatch({
      url,
      locale: 'ar',
      homeName: 'المغرب',
      awayName: 'إسبانيا',
      competitionName: 'كأس العالم',
      kickoffAt: new Date('2022-12-06T15:00:00.000Z'),
      statusCode: 'PEN',
    });
    expect(n.name).toBe('المغرب ضد إسبانيا');
    expect(n).not.toHaveProperty('location');
  });
});

describe('buildWebSite', () => {
  it('does not advertise a search url that 404s', () => {
    const node = buildWebSite(base, 'fr');
    expect(node.url).toBe(`${base}/fr`);
    expect(node).not.toHaveProperty('potentialAction');
    expect(JSON.stringify(buildGraph(node))).not.toContain('recherche');
    expect(JSON.stringify(node)).not.toContain('SearchAction');
  });
});

describe('buildFixtureItemList', () => {
  it('uses the locale url and EventScheduled for a finished match, with no score property', () => {
    const list = buildFixtureItemList({
      fixtures: [
        {
          id: 1528862,
          kickoffAt: new Date('2026-09-24T18:45:00.000Z'),
          statusCode: 'FT',
          homeName: 'Netherlands',
          awayName: 'Germany',
          homeSlug: 'netherlands-1118',
          awaySlug: 'germany-25',
        },
      ],
      locale: 'en',
      baseUrl: base,
      pageUrl: `${base}/en/competition/uefa/nations-league`,
    });
    const item = (list?.itemListElement as { item: Record<string, unknown> }[])[0].item;
    expect(item.url).toBe(`${base}/en/match/netherlands-germany-1528862`);
    expect(item.eventStatus).toBe(SCHEDULED);
    expect(item).not.toHaveProperty('homeScore');
    expect(item).not.toHaveProperty('awayScore');
  });
});

describe('buildFixtureItemList names in the page language', () => {
  it('uses ضد, not vs, on /ar', () => {
    const list = buildFixtureItemList({
      fixtures: [
        {
          id: 977345,
          kickoffAt: new Date('2022-12-06T15:00:00.000Z'),
          statusCode: 'PEN',
          homeName: 'المغرب',
          awayName: 'إسبانيا',
          homeSlug: 'morocco-31',
          awaySlug: 'spain-9',
        },
      ],
      locale: 'ar',
      baseUrl: base,
      pageUrl: `${base}/ar/competition/x/y`,
    });
    expect(JSON.stringify(list)).toContain('المغرب ضد إسبانيا');
    expect(JSON.stringify(list)).not.toContain(' vs ');
  });
});
