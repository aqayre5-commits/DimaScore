/** Shape returned by /api/v1/live and consumed by useLiveFixtures (the 30s poll). */
export interface LiveFixturePatch {
  id: number;
  homeTeamId: number | null;
  awayTeamId: number | null;
  statusCode: string;
  minute: number | null;
  extraMinute: number | null;
  homeScore: number | null;
  awayScore: number | null;
  homeScorePen: number | null;
  awayScorePen: number | null;
}
