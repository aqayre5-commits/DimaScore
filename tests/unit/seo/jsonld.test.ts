import { describe, expect, it } from 'vitest';
import {
  buildFixtureItemList,
  buildGraph,
  buildSportsEventMatch,
  buildWebSite,
  sportsEventStatus,
  visibleScoreboard,
} from '@/lib/seo/jsonld';

const base = 'https://dimascore.ma';

describe('sportsEventStatus', () => {
  it('marks finished, postponed and cancelled matches, and leaves upcoming scheduled', () => {
    expect(sportsEventStatus('FT')).toBe('https://schema.org/EventCompleted');
    expect(sportsEventStatus('AET')).toBe('https://schema.org/EventCompleted');
    expect(sportsEventStatus('PEN')).toBe('https://schema.org/EventCompleted');
    expect(sportsEventStatus('AWD')).toBe('https://schema.org/EventCompleted');
    expect(sportsEventStatus('WO')).toBe('https://schema.org/EventCompleted');
    expect(sportsEventStatus('PST')).toBe('https://schema.org/EventPostponed');
    expect(sportsEventStatus('CANC')).toBe('https://schema.org/EventCancelled');
    expect(sportsEventStatus('ABD')).toBe('https://schema.org/EventCancelled');
    expect(sportsEventStatus('NS')).toBe('https://schema.org/EventScheduled');
    expect(sportsEventStatus('TBD')).toBe('https://schema.org/EventScheduled');
    expect(sportsEventStatus('1H')).toBe('https://schema.org/EventScheduled');
    expect(sportsEventStatus('SUSP')).toBe('https://schema.org/EventScheduled');
  });
});

describe('visibleScoreboard', () => {
  it('matches the scoreboard: played and live always, interrupted only when both exist', () => {
    expect(visibleScoreboard('FT', 1, 1)).toEqual({ home: 1, away: 1 });
    expect(visibleScoreboard('FT', null, null)).toEqual({ home: 0, away: 0 });
    expect(visibleScoreboard('2H', null, 2)).toEqual({ home: 0, away: 2 });
    expect(visibleScoreboard('NS', null, null)).toBeNull();
    expect(visibleScoreboard('PST', null, null)).toBeNull();
    expect(visibleScoreboard('PST', 0, 0)).toEqual({ home: 0, away: 0 });
    expect(visibleScoreboard('CANC', 1, null)).toBeNull();
    expect(visibleScoreboard('AWD', 3, 0)).toEqual({ home: 3, away: 0 });
    expect(visibleScoreboard('WO', null, null)).toBeNull();
  });
});

describe('buildSportsEventMatch', () => {
  it('uses the page url, the visible heading, and the final score', () => {
    const url = `${base}/en/match/netherlands-germany-1528862`;
    const node = buildSportsEventMatch({
      url,
      name: 'Netherlands 1–1 Germany — UEFA Nations League',
      homeName: 'Netherlands',
      awayName: 'Germany',
      competitionName: 'UEFA Nations League',
      kickoffAt: new Date('2026-09-24T18:45:00.000Z'),
      statusCode: 'FT',
      homeScore: 1,
      awayScore: 1,
    });
    expect(node.url).toBe(url);
    expect(node['@id']).toBe(`${url}#event`);
    expect(node.name).toBe('Netherlands 1–1 Germany — UEFA Nations League');
    expect(node.eventStatus).toBe('https://schema.org/EventCompleted');
    expect(node.homeScore).toBe(1);
    expect(node.awayScore).toBe(1);
  });

  it('omits a score the upcoming page does not show, and keeps the language url', () => {
    const url = `${base}/ar/match/netherlands-germany-1528862`;
    const node = buildSportsEventMatch({
      url,
      name: 'هولندا ضد ألمانيا — دوري الأمم الأوروبية',
      homeName: 'هولندا',
      awayName: 'ألمانيا',
      competitionName: 'دوري الأمم الأوروبية',
      kickoffAt: new Date('2026-11-20T18:00:00.000Z'),
      statusCode: 'NS',
      homeScore: null,
      awayScore: null,
    });
    expect(node.url).toBe(url);
    expect(node.eventStatus).toBe('https://schema.org/EventScheduled');
    expect(node).not.toHaveProperty('homeScore');
    expect(node).not.toHaveProperty('awayScore');
  });

  it('marks a postponed match and does not invent a score', () => {
    const node = buildSportsEventMatch({
      url: `${base}/fr/match/example-1`,
      homeName: 'Raja',
      awayName: 'Wydad',
      competitionName: 'Botola Pro',
      kickoffAt: new Date('2026-11-01T18:00:00.000Z'),
      statusCode: 'PST',
      homeScore: null,
      awayScore: null,
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
  it('uses the locale url and the same status and score as the match page', () => {
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
          homeScore: 1,
          awayScore: 1,
        },
      ],
      locale: 'en',
      baseUrl: base,
      pageUrl: `${base}/en/competition/uefa/nations-league`,
    });
    const item = (list?.itemListElement as { item: Record<string, unknown> }[])[0].item;
    expect(item.url).toBe(`${base}/en/match/netherlands-germany-1528862`);
    expect(item.eventStatus).toBe('https://schema.org/EventCompleted');
    expect(item.homeScore).toBe(1);
    expect(item.awayScore).toBe(1);
  });
});
