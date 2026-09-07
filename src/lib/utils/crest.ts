/** Reconstruct api-sports team crest. Prefer this over inlining the full URL per row. */
export function teamCrestUrl(teamId: number): string {
  return `https://media.api-sports.io/football/teams/${teamId}.png`;
}

export function competitionCrestUrl(competitionId: number): string {
  return `https://media.api-sports.io/football/leagues/${competitionId}.png`;
}
