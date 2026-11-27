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
  /** An exact edition, or 'default'. A default row with `sinceSeason` applies from that edition on. */
  seasonYear: number | 'default';
  sinceSeason?: number;
  kind: CompetitionFormatKind;
  twoLeggedRounds?: string[];
  /** Every knockout round of the edition, qualifying rounds and final included, is two legs. */
  allRoundsTwoLegged?: boolean;
  thirdPlaceMatch?: boolean;
  groups?: { count: number; size: number };
  /** Best third-placed sides that go through (0 / absent: none, so no best-thirds stage). */
  bestThirdsAdvance?: number;
  leaguePhase?: { teams: number; matchdays: number; zones: ZoneBand[] };
  /**
   * Advancement key of a single-table phase on the group-stage template (UWCL league phase):
   * ranks and the knockout round they enter (`round` is a knockout-path slug), or out.
   */
  tableRules?: { from: number; to: number; key: 'advance' | 'playoff' | 'out'; round?: string }[];
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
    twoLeggedRounds: [
      'Knockout Round Play-offs',
      'Knockout play-offs',
      'Round of 32',
      'Round of 16',
      'Quarter-finals',
      'Semi-finals',
    ],
  },
  {
    competitionId: 3,
    seasonYear: 'default',
    kind: 'league-phase-knockout',
    leaguePhase: { teams: 36, matchdays: 8, zones: UCL_UEL_ZONES },
    twoLeggedRounds: [
      'Knockout Round Play-offs',
      'Knockout play-offs',
      'Round of 32',
      'Round of 16',
      'Quarter-finals',
      'Semi-finals',
    ],
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
    twoLeggedRounds: [
      'Knockout Round Play-offs',
      'Knockout play-offs',
      'Round of 32',
      'Round of 16',
      'Quarter-finals',
      'Semi-finals',
    ],
  },
  {
    // UWCL before the league phase: 4 groups of 4, top two to the quarter-finals.
    competitionId: 525,
    seasonYear: 'default',
    kind: 'league-phase-knockout',
    groups: { count: 4, size: 4 },
    twoLeggedRounds: ['Quarter-finals', 'Semi-finals'],
  },
  {
    // UWCL from 2026/27: one 18-team league phase; 1–4 → QF, 5–12 → knockout play-offs, 13–18 out.
    competitionId: 525,
    seasonYear: 'default',
    sinceSeason: 2026,
    kind: 'league-phase-knockout',
    tableRules: [
      { from: 1, to: 4, key: 'advance', round: 'quarter-finals' },
      { from: 5, to: 12, key: 'playoff', round: 'knockout-play-offs' },
      { from: 13, to: 18, key: 'out' },
    ],
    twoLeggedRounds: [
      'Knockout Round Play-offs',
      'Knockout play-offs',
      'Play-offs',
      'Quarter-finals',
      'Semi-finals',
    ],
  },
  {
    // Women's Europa Cup, first edition: a two-legged knockout.
    competitionId: 1191,
    seasonYear: 'default',
    kind: 'league-phase-knockout',
    twoLeggedRounds: [
      '1st Round',
      '2nd Round',
      'Round of 16',
      'Quarter-finals',
      'Semi-finals',
      'Final',
    ],
    unverified: ['legs per stage before 2026/27'],
  },
  {
    // Women's Europa Cup 2026/27: all six rounds are two legs, qualifying rounds and final included.
    competitionId: 1191,
    seasonYear: 'default',
    sinceSeason: 2026,
    kind: 'league-phase-knockout',
    allRoundsTwoLegged: true,
  },
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
    // 3 groups of 4: the top two of each plus the two best third-placed sides reach the quarter-finals.
    groups: { count: 3, size: 4 },
    bestThirdsAdvance: 2,
  },
  {
    competitionId: 922,
    // The 2026 edition is filed under provider season 2025.
    seasonYear: 2025,
    kind: 'finals-tournament',
    // 4 groups of 4: the top two of each go straight to the quarter-finals (no best thirds).
    groups: { count: 4, size: 4 },
    bestThirdsAdvance: 0,
  },
  {
    competitionId: 822,
    seasonYear: 'default',
    kind: 'domestic-cup',
    unverified: ['two-legged rounds'],
  },
  {
    // CAF Champions League: two preliminary knockouts, 4 × 4 groups, then two-legged knockouts;
    // the final is two legs (one aggregate card in the draw, two dated matches in Fixtures).
    competitionId: 12,
    seasonYear: 'default',
    kind: 'league-phase-knockout',
    groups: { count: 4, size: 4 },
    twoLeggedRounds: [
      '1st Round',
      '2nd Round',
      'Preliminary Round',
      'Quarter-finals',
      'Semi-finals',
      'Final',
    ],
  },
  {
    // CAF Confederation Cup: same shape as the CAF Champions League, two-legged final.
    competitionId: 20,
    seasonYear: 'default',
    kind: 'league-phase-knockout',
    groups: { count: 4, size: 4 },
    twoLeggedRounds: [
      '1st Round',
      '2nd Round',
      'Preliminary Round',
      'Quarter-finals',
      'Semi-finals',
      'Final',
    ],
  },
  {
    // CAF Women's Champions League: 2 groups of 4, semi-finals, third-place match, then a
    // single-match final (not in `twoLeggedRounds`).
    competitionId: 1164,
    seasonYear: 'default',
    kind: 'league-phase-knockout',
    groups: { count: 2, size: 4 },
    thirdPlaceMatch: true,
    unverified: ['competition id 1164 (third-party listing)'],
  },
  {
    competitionId: 1164,
    seasonYear: 2026,
    kind: 'league-phase-knockout',
    groups: { count: 2, size: 4 },
    thirdPlaceMatch: true,
    unverified: ['competition id 1164 (third-party listing)'],
  },
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
  // U20 World Cup 2025 (provider current): 24 teams, 6 groups of 4, top two plus
  // 4 best thirds to the round of 16 (8 ties), plus a "3rd place" match.
  // Source: production Neon standings/fixtures ingested from API-Football
  // (490/2025: 36 group-stage fixtures, 8 R16, 1 "3rd place" — Colombia U20 1-0 France U20, 18 Oct 2025).
  {
    competitionId: 490,
    seasonYear: 2025,
    kind: 'finals-tournament',
    groups: { count: 6, size: 4 },
    bestThirdsAdvance: 4,
    thirdPlaceMatch: true,
  },
  {
    competitionId: 490,
    seasonYear: 'default',
    kind: 'finals-tournament',
    groups: { count: 6, size: 4 },
    bestThirdsAdvance: 4,
    thirdPlaceMatch: true,
  },
  // FIFA U-17 World Cup: 48 teams, 12 groups of 4, top two plus 8 best thirds
  // to the round of 32, plus a third-place match. 2026 is the provider's current
  // season (label "2026", single-year). Source: production Neon (API-Football
  // ingest) standings for 587/2026 — Groups A–L, 48 teams, plus a feed table
  // "Ranking of third-placed teams" (12 sides); 72 group-stage fixtures. Knockout
  // rounds and the third-place match are not in the feed yet (group stage ends
  // 27 Nov 2026; FIFA schedule: R32 from 30 Nov, third-place and final 13 Dec).
  // 2025 Qatar edition used the same format (FIFA.com).
  {
    competitionId: 587,
    seasonYear: 2025,
    kind: 'finals-tournament',
    groups: { count: 12, size: 4 },
    bestThirdsAdvance: 8,
    thirdPlaceMatch: true,
  },
  {
    competitionId: 587,
    seasonYear: 2026,
    kind: 'finals-tournament',
    groups: { count: 12, size: 4 },
    bestThirdsAdvance: 8,
    thirdPlaceMatch: true,
  },
  {
    competitionId: 587,
    seasonYear: 'default',
    sinceSeason: 2025,
    kind: 'finals-tournament',
    groups: { count: 12, size: 4 },
    bestThirdsAdvance: 8,
    thirdPlaceMatch: true,
  },
  // U20 Women's World Cup 2026 (provider current): 24 teams, 6 groups of 4,
  // top two plus 4 best thirds to the round of 16 (8 ties), plus a "3rd place"
  // match. Not the older 16-team / quarter-final format. Source: production
  // Neon standings/fixtures (920/2026: Groups A–F of 4, 36 group fixtures, 8 R16,
  // "3rd place" Italy U20 W vs Colombia U20 W, 26 Sep 2026, PEN).
  {
    competitionId: 920,
    seasonYear: 2026,
    kind: 'finals-tournament',
    groups: { count: 6, size: 4 },
    bestThirdsAdvance: 4,
    thirdPlaceMatch: true,
  },
  {
    competitionId: 920,
    seasonYear: 'default',
    kind: 'finals-tournament',
    groups: { count: 6, size: 4 },
    bestThirdsAdvance: 4,
    thirdPlaceMatch: true,
  },
  // U17 Women's World Cup 2026 (provider current): same 24-team shape as 920
  // (6×4, 4 best thirds, R16, "3rd place"). Group matchdays in the feed are
  // named "World Cup Women U17 - 1/2/3", not "Group Stage". Source: production
  // Neon standings/fixtures (950/2026: Groups A–F of 4, 36 group fixtures, 8 R16,
  // "3rd place" North Korea U17 W 6-0 Brazil U17 W, 7 Nov 2026).
  {
    competitionId: 950,
    seasonYear: 2026,
    kind: 'finals-tournament',
    groups: { count: 6, size: 4 },
    bestThirdsAdvance: 4,
    thirdPlaceMatch: true,
  },
  {
    competitionId: 950,
    seasonYear: 'default',
    kind: 'finals-tournament',
    groups: { count: 6, size: 4 },
    bestThirdsAdvance: 4,
    thirdPlaceMatch: true,
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
    // A default row that starts at an edition applies from then on (latest start wins).
    const since = list
      .filter(
        (f) => f.seasonYear === 'default' && f.sinceSeason != null && f.sinceSeason <= seasonYear,
      )
      .sort((a, b) => (b.sinceSeason ?? 0) - (a.sinceSeason ?? 0))[0];
    if (since) return since;
  }
  return list.find((f) => f.seasonYear === 'default' && f.sinceSeason == null) ?? list[0] ?? null;
}

export function listCompetitionFormats(): EditionFormat[] {
  return FORMATS.slice();
}
