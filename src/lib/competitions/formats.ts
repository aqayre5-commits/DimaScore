/**
 * Format registry for competition pages (data only — no UI).
 * Edition-specific rows override `default` for the same competition id.
 *
 * Fields listed in `unverified` are best-effort from public sources and must
 * be confirmed with a free `/leagues?id=` (or `/fixtures/rounds`) call before
 * the first ingest. Do not treat them as live API-Football facts.
 */

export type CompetitionFormatKind =
  | 'league'
  | 'domestic-cup'
  | 'league-phase-knockout'
  | 'tiered-groups'
  | 'finals-tournament'
  | 'qualifiers'
  | 'friendlies';

export interface ZoneBand {
  from: number;
  to: number;
  key: string;
}

export interface EditionFormat {
  competitionId: number;
  seasonYear: number | 'default';
  kind: CompetitionFormatKind;
  twoLeggedRounds?: string[];
  thirdPlaceMatch?: boolean;
  groups?: { count: number; size: number };
  bestThirdsAdvance?: number;
  leaguePhase?: { teams: number; matchdays: number; zones: ZoneBand[] };
  unverified?: string[];
}

const UCL_UEL_ZONES: ZoneBand[] = [
  { from: 1, to: 8, key: 'r16' },
  { from: 9, to: 24, key: 'playoff' },
  { from: 25, to: 36, key: 'eliminated' },
];

const FORMATS: EditionFormat[] = [
  // ── Already ingested ──
  { competitionId: 39, seasonYear: 'default', kind: 'league' },
  { competitionId: 140, seasonYear: 'default', kind: 'league' },
  { competitionId: 135, seasonYear: 'default', kind: 'league' },
  { competitionId: 78, seasonYear: 'default', kind: 'league' },
  { competitionId: 61, seasonYear: 'default', kind: 'league' },
  { competitionId: 200, seasonYear: 'default', kind: 'league' },
  { competitionId: 201, seasonYear: 'default', kind: 'league' },
  { competitionId: 186, seasonYear: 'default', kind: 'league' },
  { competitionId: 202, seasonYear: 'default', kind: 'league' },
  { competitionId: 233, seasonYear: 'default', kind: 'league' },
  { competitionId: 203, seasonYear: 'default', kind: 'league' },
  { competitionId: 301, seasonYear: 'default', kind: 'league' },
  { competitionId: 307, seasonYear: 'default', kind: 'league' },
  { competitionId: 44, seasonYear: 'default', kind: 'league' },
  { competitionId: 142, seasonYear: 'default', kind: 'league' },
  { competitionId: 139, seasonYear: 'default', kind: 'league' },
  { competitionId: 82, seasonYear: 'default', kind: 'league' },
  {
    competitionId: 2,
    seasonYear: 'default',
    kind: 'league-phase-knockout',
    leaguePhase: { teams: 36, matchdays: 8, zones: UCL_UEL_ZONES },
    twoLeggedRounds: ['Knockout Round Play-offs', 'Round of 16', 'Quarter-finals', 'Semi-finals'],
  },
  {
    competitionId: 3,
    seasonYear: 'default',
    kind: 'league-phase-knockout',
    leaguePhase: { teams: 36, matchdays: 8, zones: UCL_UEL_ZONES },
    twoLeggedRounds: ['Knockout Round Play-offs', 'Round of 16', 'Quarter-finals', 'Semi-finals'],
  },
  {
    competitionId: 848,
    seasonYear: 'default',
    kind: 'league-phase-knockout',
    leaguePhase: {
      teams: 36,
      matchdays: 6,
      zones: [
        { from: 1, to: 8, key: 'r16' },
        { from: 9, to: 24, key: 'playoff' },
        { from: 25, to: 36, key: 'eliminated' },
      ],
    },
    twoLeggedRounds: ['Knockout Round Play-offs', 'Round of 16', 'Quarter-finals', 'Semi-finals'],
  },
  { competitionId: 525, seasonYear: 'default', kind: 'league-phase-knockout' },
  { competitionId: 1191, seasonYear: 'default', kind: 'league-phase-knockout' },
  { competitionId: 5, seasonYear: 'default', kind: 'tiered-groups' },
  {
    competitionId: 1,
    seasonYear: 2026,
    kind: 'finals-tournament',
    groups: { count: 12, size: 4 },
    bestThirdsAdvance: 8,
    thirdPlaceMatch: true,
  },
  {
    competitionId: 6,
    seasonYear: 'default',
    kind: 'finals-tournament',
    groups: { count: 6, size: 4 },
    bestThirdsAdvance: 4,
    thirdPlaceMatch: true,
  },
  {
    competitionId: 922,
    seasonYear: 2024,
    kind: 'finals-tournament',
    groups: { count: 3, size: 4 },
    bestThirdsAdvance: 4,
  },
  {
    competitionId: 922,
    seasonYear: 2026,
    kind: 'finals-tournament',
    groups: { count: 4, size: 4 },
  },
  { competitionId: 822, seasonYear: 'default', kind: 'domestic-cup', unverified: ['two-legged rounds'] },
  { competitionId: 12, seasonYear: 'default', kind: 'league-phase-knockout' },
  { competitionId: 20, seasonYear: 'default', kind: 'league-phase-knockout' },
  { competitionId: 10, seasonYear: 'default', kind: 'friendlies' },
  { competitionId: 29, seasonYear: 'default', kind: 'qualifiers' },
  { competitionId: 32, seasonYear: 'default', kind: 'qualifiers' },
  { competitionId: 31, seasonYear: 'default', kind: 'qualifiers' },
  { competitionId: 34, seasonYear: 'default', kind: 'qualifiers' },
  { competitionId: 30, seasonYear: 'default', kind: 'qualifiers' },
  { competitionId: 33, seasonYear: 'default', kind: 'qualifiers' },
  { competitionId: 37, seasonYear: 'default', kind: 'qualifiers' },
  { competitionId: 36, seasonYear: 'default', kind: 'qualifiers' },

  // ── D1 additions ──
  {
    competitionId: 4,
    seasonYear: 2024,
    kind: 'finals-tournament',
    groups: { count: 6, size: 4 },
    bestThirdsAdvance: 4,
    thirdPlaceMatch: false,
  },
  {
    competitionId: 4,
    seasonYear: 'default',
    kind: 'finals-tournament',
    groups: { count: 6, size: 4 },
    bestThirdsAdvance: 4,
    thirdPlaceMatch: false,
    unverified: ['2028 group count and thirds rule'],
  },
  { competitionId: 960, seasonYear: 'default', kind: 'qualifiers' },
  {
    competitionId: 9,
    seasonYear: 2024,
    kind: 'finals-tournament',
    groups: { count: 4, size: 4 },
    thirdPlaceMatch: true,
  },
  {
    competitionId: 9,
    seasonYear: 'default',
    kind: 'finals-tournament',
    groups: { count: 4, size: 4 },
    thirdPlaceMatch: true,
    unverified: ['2028 format'],
  },
  {
    competitionId: 15,
    seasonYear: 2025,
    kind: 'finals-tournament',
    groups: { count: 8, size: 4 },
    thirdPlaceMatch: false,
  },
  {
    competitionId: 15,
    seasonYear: 'default',
    kind: 'finals-tournament',
    groups: { count: 8, size: 4 },
    thirdPlaceMatch: false,
  },
  { competitionId: 45, seasonYear: 'default', kind: 'domestic-cup' },
  {
    competitionId: 143,
    seasonYear: 'default',
    kind: 'domestic-cup',
    twoLeggedRounds: ['Semi-finals'],
  },
  {
    competitionId: 8,
    seasonYear: 'default',
    kind: 'finals-tournament',
    groups: { count: 8, size: 4 },
    unverified: ['2027 group count (32-team field)'],
  },
  {
    competitionId: 480,
    seasonYear: 'default',
    kind: 'finals-tournament',
    groups: { count: 3, size: 4 },
    bestThirdsAdvance: 2,
    unverified: ['group count / thirds for the next Olympics'],
  },
  {
    competitionId: 524,
    seasonYear: 'default',
    kind: 'finals-tournament',
    groups: { count: 4, size: 4 },
    unverified: ['group count for the next Olympics'],
  },
  {
    competitionId: 490,
    seasonYear: 'default',
    kind: 'finals-tournament',
    groups: { count: 6, size: 4 },
    bestThirdsAdvance: 4,
    unverified: ['group count / thirds'],
  },
  {
    competitionId: 587,
    seasonYear: 'default',
    kind: 'finals-tournament',
    groups: { count: 12, size: 4 },
    bestThirdsAdvance: 8,
    unverified: ['group count / thirds'],
  },
  {
    competitionId: 920,
    seasonYear: 'default',
    kind: 'finals-tournament',
    groups: { count: 6, size: 4 },
    bestThirdsAdvance: 4,
    unverified: ['group count / thirds'],
  },
  {
    competitionId: 950,
    seasonYear: 'default',
    kind: 'finals-tournament',
    groups: { count: 6, size: 4 },
    bestThirdsAdvance: 4,
    unverified: ['group count / thirds'],
  },
  {
    competitionId: 538,
    seasonYear: 'default',
    kind: 'finals-tournament',
    unverified: ['group count, thirds, third-place match'],
  },
  {
    competitionId: 973,
    seasonYear: 'default',
    kind: 'finals-tournament',
    unverified: ['group count, thirds, third-place match'],
  },
  {
    competitionId: 1015,
    seasonYear: 'default',
    kind: 'finals-tournament',
    unverified: ['group count, thirds, third-place match'],
  },
  { competitionId: 953, seasonYear: 'default', kind: 'qualifiers' },
];

const byCompetition = new Map<number, EditionFormat[]>();
for (const format of FORMATS) {
  const list = byCompetition.get(format.competitionId) ?? [];
  list.push(format);
  byCompetition.set(format.competitionId, list);
}

export function getCompetitionFormat(
  competitionId: number,
  seasonYear?: number,
): EditionFormat | null {
  const list = byCompetition.get(competitionId);
  if (!list) return null;
  if (seasonYear != null) {
    const exact = list.find((f) => f.seasonYear === seasonYear);
    if (exact) return exact;
  }
  return list.find((f) => f.seasonYear === 'default') ?? list[0] ?? null;
}

export function listCompetitionFormats(): EditionFormat[] {
  return FORMATS.slice();
}
