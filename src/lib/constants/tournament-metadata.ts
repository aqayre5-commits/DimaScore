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
  mediaYoutubeIds: string[];
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
    { label: 'A', teamCodes: ['MX', 'ZA', 'KR', 'CZ'], isMoroccoGroup: false },
    { label: 'B', teamCodes: ['CA', 'BA', 'IR', 'CH'], isMoroccoGroup: false },
    { label: 'C', teamCodes: ['AR', 'MA', 'SA', 'EG'], isMoroccoGroup: true },
    { label: 'D', teamCodes: ['US', 'EC', 'CL', 'PY'], isMoroccoGroup: false },
    { label: 'E', teamCodes: ['BR', 'JP', 'NG', 'RS'], isMoroccoGroup: false },
    { label: 'F', teamCodes: ['FR', 'CO', 'CM', 'NZ'], isMoroccoGroup: false },
    { label: 'G', teamCodes: ['DE', 'UY', 'GH', 'SE'], isMoroccoGroup: false },
    { label: 'H', teamCodes: ['ES', 'AU', 'TN', 'CR'], isMoroccoGroup: false },
    { label: 'I', teamCodes: ['GB', 'SN', 'PE', 'JM'], isMoroccoGroup: false },
    { label: 'J', teamCodes: ['PT', 'DZ', 'QA', 'HN'], isMoroccoGroup: false },
    { label: 'K', teamCodes: ['NL', 'CI', 'PA', 'NO'], isMoroccoGroup: false },
    { label: 'L', teamCodes: ['BE', 'HR', 'CD', 'IS'], isMoroccoGroup: false },
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
  mediaYoutubeIds: [],
};

const METADATA_REGISTRY: Map<number, TournamentMetadata> = new Map([[1, WC_2026]]);

/** Look up tournament metadata by competition ID. */
export function getMetadataForCompetition(id: number): TournamentMetadata | undefined {
  return METADATA_REGISTRY.get(id);
}
