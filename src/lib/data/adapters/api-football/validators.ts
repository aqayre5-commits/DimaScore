/**
 * Runtime guards for critical API-Football response shapes.
 * Each guard validates that required nested fields exist and have the expected type.
 * Malformed entries are logged and filtered out rather than crashing normalizers.
 */

import type { RawFixtureEntry, RawStandingsEntry, RawTeamEntry, RawLeagueEntry } from './types';

function isObj(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function isNum(v: unknown): v is number {
  return typeof v === 'number' && !Number.isNaN(v);
}

function isStr(v: unknown): v is string {
  return typeof v === 'string';
}

export function isValidFixtureEntry(raw: unknown): raw is RawFixtureEntry {
  if (!isObj(raw)) return false;
  const f = raw.fixture;
  if (!isObj(f) || !isNum(f.id) || !isStr(f.date)) return false;
  const status = f.status;
  if (!isObj(status) || !isStr(status.short)) return false;
  const league = raw.league;
  if (!isObj(league) || !isNum(league.id)) return false;
  const teams = raw.teams;
  if (!isObj(teams)) return false;
  const home = teams.home;
  const away = teams.away;
  if (!isObj(home) || !isNum(home.id) || !isStr(home.name)) return false;
  if (!isObj(away) || !isNum(away.id) || !isStr(away.name)) return false;
  const goals = raw.goals;
  if (!isObj(goals)) return false;
  const score = raw.score;
  if (!isObj(score)) return false;
  return true;
}

export function isValidStandingsEntry(raw: unknown): raw is RawStandingsEntry {
  if (!isObj(raw)) return false;
  const league = raw.league;
  if (!isObj(league) || !isNum(league.id)) return false;
  const standings = league.standings;
  if (!Array.isArray(standings)) return false;
  for (const group of standings) {
    if (!Array.isArray(group)) return false;
    for (const row of group) {
      if (!isObj(row) || !isNum(row.rank) || !isNum(row.points)) return false;
      const team = row.team;
      if (!isObj(team) || !isNum(team.id) || !isStr(team.name)) return false;
    }
  }
  return true;
}

export function isValidTeamEntry(raw: unknown): raw is RawTeamEntry {
  if (!isObj(raw)) return false;
  const team = raw.team;
  if (!isObj(team) || !isNum(team.id) || !isStr(team.name)) return false;
  return true;
}

export function isValidLeagueEntry(raw: unknown): raw is RawLeagueEntry {
  if (!isObj(raw)) return false;
  const league = raw.league;
  if (!isObj(league) || !isNum(league.id) || !isStr(league.name)) return false;
  const country = raw.country;
  if (!isObj(country) || !isStr(country.name)) return false;
  if (!Array.isArray(raw.seasons)) return false;
  return true;
}

/**
 * Filter + validate an array of API response entries.
 * Logs a warning for each skipped entry, returns only valid ones.
 */
export function filterValid<T>(
  entries: unknown[],
  guard: (entry: unknown) => entry is T,
  endpoint: string,
): T[] {
  const valid: T[] = [];
  for (let i = 0; i < entries.length; i++) {
    if (guard(entries[i])) {
      valid.push(entries[i] as T);
    } else {
      console.warn(
        `[api-football] Skipping malformed ${endpoint} entry at index ${i}:`,
        JSON.stringify(entries[i]).slice(0, 200),
      );
    }
  }
  return valid;
}
