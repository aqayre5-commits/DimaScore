import { describe, it, expect } from 'vitest';
import {
  slugifyRound,
  isQualifyingRound,
  buildTeamHref,
  buildQualifyingHref,
  buildRoundHref,
  QUALIFYING_SEGMENT,
  ROUND_SEGMENT,
} from '@/lib/competitions/paths';

describe('slugifyRound', () => {
  it('builds a stable slug from an API-Football round label', () => {
    expect(slugifyRound('1st Qualifying Round')).toBe('1st-qualifying-round');
    expect(slugifyRound('Knockout Round Play-offs')).toBe('knockout-round-play-offs');
    expect(slugifyRound('League Stage - 5')).toBe('league-stage-5');
  });

  it('does not collide with reserved tab words that 301 to the hub', () => {
    expect(slugifyRound('Fixtures')).toBe('round-fixtures');
    expect(slugifyRound('standings')).toBe('round-standings');
  });
});

describe('isQualifyingRound', () => {
  it('detects qualifying and preliminary rounds', () => {
    expect(isQualifyingRound('1st Qualifying Round')).toBe(true);
    expect(isQualifyingRound('Preliminary Round')).toBe(true);
    expect(isQualifyingRound('3rd Qualifying Round')).toBe(true);
  });

  it('does not treat knockout or promotion play-offs as qualifying', () => {
    expect(isQualifyingRound('Knockout Round Play-offs')).toBe(false);
    expect(isQualifyingRound('Round of 16')).toBe(false);
    expect(isQualifyingRound('Promotion Play-offs')).toBe(false);
  });
});

describe('crawlable hrefs', () => {
  it('builds a team category URL from the existing equipe + trailing-id slug', () => {
    expect(buildTeamHref('en', 'france-2')).toBe('/en/equipe/france-2');
    expect(buildTeamHref('fr', 'france-women-14461')).toBe('/fr/equipe/france-women-14461');
  });

  it('builds qualifier and named-round URLs under the competition hub (UCL = 2)', () => {
    expect(buildQualifyingHref(2, 'en')).toBe(
      `/en/competition/uefa/champions-league/${QUALIFYING_SEGMENT}`,
    );
    expect(buildRoundHref(2, 'en', '1st Qualifying Round')).toBe(
      `/en/competition/uefa/champions-league/${QUALIFYING_SEGMENT}/1st-qualifying-round`,
    );
    expect(buildRoundHref(2, 'en', 'League Stage - 5')).toBe(
      `/en/competition/uefa/champions-league/${ROUND_SEGMENT}/league-stage-5`,
    );
    expect(buildRoundHref(2, 'en', 'Knockout Round Play-offs')).toBe(
      `/en/competition/uefa/champions-league/${ROUND_SEGMENT}/knockout-round-play-offs`,
    );
  });

  it('returns null when the competition is not in the catalog', () => {
    expect(buildQualifyingHref(999999, 'en')).toBeNull();
  });
});
