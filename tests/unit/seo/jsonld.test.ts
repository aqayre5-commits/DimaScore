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
