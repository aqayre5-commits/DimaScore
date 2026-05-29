/**
 * Tournament metadata — discriminated union per user Q4 decision.
 * Static data that drives rendering decisions for competition pages.
 * Group compositions for WC 2026 match the seeded fixtures/standings data.
 */

export interface GroupDefinition {
  label: string;
  teamCodes: string[];
  isMoroccoGroup: boolean;
}

export interface HistoricalWinner {
  year: number;
  teamCode: string;
  runnerUpCode: string;
  hostCountryCodes: string[];
  titleNumber: number;
}

interface QualificationZone {
  positions: number[];
  type: 'qualified' | 'playoff' | 'eliminated';
  color: string;
}

interface BaseTournamentMetadata {
  competitionId: number;
  editionYear: number;
}

export interface CupMetadata extends BaseTournamentMetadata {
  type: 'cup';
  format: 'groups_and_knockout' | 'pure_knockout' | 'swiss_and_knockout' | 'league_phase_only';
  groupsCount: number | null;
  teamsCount: number;
  hostCountryCodes: string[];
  kickoffDate: string;
  finalDate: string;
  fifaRankingApplicable: boolean;
  homeAwayMeaningful: boolean;
  knockoutStartsRound: 'r32' | 'r16' | 'qf';
  hasThirdPlaceMatch: boolean;
  hasBestThirdPlace: boolean;
  groups: GroupDefinition[];
  historicalWinners: HistoricalWinner[];
  relatedCompetitionIds: number[];
  qualificationZones: QualificationZone[];
}

export interface LeagueMetadata extends BaseTournamentMetadata {
  type: 'league';
}

export type TournamentMetadata = CupMetadata | LeagueMetadata;

/**
 * WC 2026 — canonical Page 3 instance.
 * 12 groups, 48 teams, groups_and_knockout format.
 * Group compositions match seeded Phase 2 data.
 */
const WC_2026: CupMetadata = {
  competitionId: 1,
  editionYear: 2026,
  type: 'cup',
  format: 'groups_and_knockout',
  groupsCount: 12,
  teamsCount: 48,
  hostCountryCodes: ['US', 'CA', 'MX'],
  kickoffDate: '2026-06-11',
  finalDate: '2026-07-19',
  fifaRankingApplicable: true,
  homeAwayMeaningful: false,
  knockoutStartsRound: 'r32',
  hasThirdPlaceMatch: true,
  hasBestThirdPlace: true,
  groups: [
    { label: 'A', teamCodes: ['MEX', 'SOU', 'KOR', 'CZE'], isMoroccoGroup: false },
    { label: 'B', teamCodes: ['CAN', 'BOS', 'QAT', 'SWI'], isMoroccoGroup: false },
    { label: 'C', teamCodes: ['BRA', 'MOR', 'HAI', 'SCO'], isMoroccoGroup: false },
    { label: 'D', teamCodes: ['USA', 'PAR', 'AUS', 'TUR'], isMoroccoGroup: false },
    { label: 'E', teamCodes: ['GER', 'CUR', 'IVO', 'ECU'], isMoroccoGroup: false },
    { label: 'F', teamCodes: ['NET', 'JAP', 'SWE', 'TUN'], isMoroccoGroup: false },
    { label: 'G', teamCodes: ['BEL', 'EGY', 'IRA', 'ZEA'], isMoroccoGroup: false },
    { label: 'H', teamCodes: ['SPA', 'CAP', 'SAU', 'URU'], isMoroccoGroup: false },
    { label: 'I', teamCodes: ['FRA', 'SEN', 'IRQ', 'NOR'], isMoroccoGroup: false },
    { label: 'J', teamCodes: ['ARG', 'ALG', 'AUT', 'JOR'], isMoroccoGroup: false },
    { label: 'K', teamCodes: ['POR', 'CON', 'UZB', 'COL'], isMoroccoGroup: false },
    { label: 'L', teamCodes: ['ENG', 'CRO', 'GHA', 'PAN'], isMoroccoGroup: false },
  ],
  historicalWinners: [
    { year: 2022, teamCode: 'AR', runnerUpCode: 'FR', hostCountryCodes: ['QA'], titleNumber: 3 },
    { year: 2018, teamCode: 'FR', runnerUpCode: 'HR', hostCountryCodes: ['RU'], titleNumber: 2 },
    { year: 2014, teamCode: 'DE', runnerUpCode: 'AR', hostCountryCodes: ['BR'], titleNumber: 4 },
    { year: 2010, teamCode: 'ES', runnerUpCode: 'NL', hostCountryCodes: ['ZA'], titleNumber: 1 },
    { year: 2006, teamCode: 'IT', runnerUpCode: 'FR', hostCountryCodes: ['DE'], titleNumber: 4 },
  ],
  relatedCompetitionIds: [29, 32, 31, 34, 30, 33, 37],
  qualificationZones: [
    { positions: [1, 2], type: 'qualified', color: 'var(--accent-emerald)' },
    { positions: [3], type: 'playoff', color: 'var(--accent-amber)' },
    { positions: [4], type: 'eliminated', color: 'var(--accent-crimson)' },
  ],
};

/**
 * WAFCON 2024 — Women's Africa Cup of Nations (played July 2025 in Morocco).
 * API-Football labels this season "2024". All 26 matches completed. Nigeria won.
 * 12 teams, 3 groups, QF knockout start.
 */
const WAFCON_2024: CupMetadata = {
  competitionId: 922,
  editionYear: 2024,
  type: 'cup',
  format: 'groups_and_knockout',
  groupsCount: 3,
  teamsCount: 12,
  hostCountryCodes: ['MA'],
  kickoffDate: '2025-07-05',
  finalDate: '2025-07-26',
  fifaRankingApplicable: false,
  homeAwayMeaningful: false,
  knockoutStartsRound: 'qf',
  hasThirdPlaceMatch: true,
  hasBestThirdPlace: false,
  groups: [
    { label: 'A', teamCodes: ['MA', 'ZM', 'SN', 'CD'], isMoroccoGroup: true },
    { label: 'B', teamCodes: ['NG', 'TN', 'DZ', 'BW'], isMoroccoGroup: false },
    { label: 'C', teamCodes: ['ZA', 'GH', 'ML', 'TZ'], isMoroccoGroup: false },
  ],
  historicalWinners: [
    { year: 2024, teamCode: 'NG', runnerUpCode: 'MA', hostCountryCodes: ['MA'], titleNumber: 12 },
    { year: 2022, teamCode: 'ZA', runnerUpCode: 'MA', hostCountryCodes: ['MA'], titleNumber: 1 },
    { year: 2018, teamCode: 'ZA', runnerUpCode: 'CM', hostCountryCodes: ['GH'], titleNumber: 2 },
    { year: 2016, teamCode: 'NG', runnerUpCode: 'CM', hostCountryCodes: ['CM'], titleNumber: 11 },
  ],
  relatedCompetitionIds: [],
  qualificationZones: [
    { positions: [1, 2], type: 'qualified', color: 'var(--accent-emerald)' },
    { positions: [3, 4], type: 'eliminated', color: 'var(--accent-crimson)' },
  ],
};

/**
 * WAFCON 2026 — Women's Africa Cup of Nations (upcoming, 25 Jul – 16 Aug 2026).
 * 16 teams (expanded from 12). Hosted in Morocco. Groups TBD until draw.
 * No API-Football data yet — pre-tournament placeholder.
 */
const WAFCON_2026: CupMetadata = {
  competitionId: 922,
  editionYear: 2026,
  type: 'cup',
  format: 'groups_and_knockout',
  groupsCount: 4,
  teamsCount: 16,
  hostCountryCodes: ['MA'],
  kickoffDate: '2026-07-25',
  finalDate: '2026-08-16',
  fifaRankingApplicable: false,
  homeAwayMeaningful: false,
  knockoutStartsRound: 'qf',
  hasThirdPlaceMatch: true,
  hasBestThirdPlace: false,
  groups: [],
  historicalWinners: [
    { year: 2024, teamCode: 'NG', runnerUpCode: 'MA', hostCountryCodes: ['MA'], titleNumber: 12 },
    { year: 2022, teamCode: 'ZA', runnerUpCode: 'MA', hostCountryCodes: ['MA'], titleNumber: 1 },
    { year: 2018, teamCode: 'ZA', runnerUpCode: 'CM', hostCountryCodes: ['GH'], titleNumber: 2 },
    { year: 2016, teamCode: 'NG', runnerUpCode: 'CM', hostCountryCodes: ['CM'], titleNumber: 11 },
  ],
  relatedCompetitionIds: [],
  qualificationZones: [],
};

/** Default metadata per competition (latest/upcoming edition). */
const METADATA_REGISTRY: Map<number, TournamentMetadata> = new Map([
  [1, WC_2026],
  [922, WAFCON_2026],
]);

/** Season-specific metadata: key = "competitionId:editionYear". */
const METADATA_BY_SEASON: Map<string, TournamentMetadata> = new Map([
  ['1:2026', WC_2026],
  ['922:2024', WAFCON_2024],
  ['922:2026', WAFCON_2026],
]);

/** Look up tournament metadata by competition ID (returns latest/upcoming edition). */
export function getMetadataForCompetition(id: number): TournamentMetadata | undefined {
  return METADATA_REGISTRY.get(id);
}

/** Look up tournament metadata for a specific edition year. */
export function getMetadataForCompetitionSeason(
  id: number,
  editionYear: number,
): TournamentMetadata | undefined {
  return METADATA_BY_SEASON.get(`${id}:${editionYear}`);
}
