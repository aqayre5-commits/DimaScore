/**
 * Preview-only header model for instant soft-navigation to /match/[id].
 *
 * Fixture/list surfaces seed a `MatchHeaderPreview` into the TanStack Query
 * cache (key: qk.matchHeader(id)). During a client navigation, the route's
 * loading.tsx reads it and paints a real partial header instead of a gray
 * skeleton. The canonical RSC page then upgrades it (venue/referee/round/
 * goal-scorers). This is a transient client cache value only — never fetched
 * over the network, never the source of truth.
 */

import type { TeamSnapshot } from '@/lib/db/queries-hydrate';
import type { DayFixture } from '@/lib/db/queries/fixtures-by-day';
import type { TickerFixture } from '@/lib/db/queries';
import type { MatchDetail } from '@/lib/db/queries/match-detail';

export interface MatchHeaderPreviewTeam {
  name: Record<string, string>;
  shortName: Record<string, string>;
  code: string | null;
  countryCode: string | null;
  logoUrl: string | null;
  isNational: boolean | null;
}

export interface MatchHeaderPreview {
  homeTeam: MatchHeaderPreviewTeam | null;
  awayTeam: MatchHeaderPreviewTeam | null;
  homeScore: number | null;
  awayScore: number | null;
  statusCode: string;
  minute: number | null;
  /** ISO 8601 — must be serializable for the query cache. */
  kickoffAt: string;
  /** Optional: only surfaces that already carry competition pass this. */
  competition: { name: Record<string, string>; slug: string } | null;
}

/** Structural input — accepts FixtureRow's FixtureTeam, TeamSnapshot, and MatchDetail teams. */
type PreviewTeamInput = {
  name: Record<string, string>;
  shortName?: Record<string, string>;
  code?: string | null;
  countryCode?: string | null;
  logoUrl?: string | null;
  isNational?: boolean | null;
} | null;

function normalizeTeam(t: PreviewTeamInput): MatchHeaderPreviewTeam | null {
  if (!t) return null;
  return {
    name: t.name,
    shortName: t.shortName ?? t.name,
    code: t.code ?? null,
    countryCode: t.countryCode ?? null,
    logoUrl: t.logoUrl ?? null,
    isNational: t.isNational ?? null,
  };
}

/**
 * Generic parts-based preview. Used by the shared fixture row (no minute/
 * competition) and by other surfaces that pass explicit fields. `minute` and
 * `competition` are optional; `kickoffAt` accepts a Date or an ISO string.
 */
export function previewFromFixtureRow(p: {
  homeTeam: PreviewTeamInput;
  awayTeam: PreviewTeamInput;
  homeScore: number | null;
  awayScore: number | null;
  statusCode: string;
  kickoffAt: Date | string;
  minute?: number | null;
  competition?: { name: Record<string, string>; slug: string } | null;
}): MatchHeaderPreview {
  return {
    homeTeam: normalizeTeam(p.homeTeam),
    awayTeam: normalizeTeam(p.awayTeam),
    homeScore: p.homeScore,
    awayScore: p.awayScore,
    statusCode: p.statusCode,
    minute: p.minute ?? null,
    kickoffAt: typeof p.kickoffAt === 'string' ? p.kickoffAt : p.kickoffAt.toISOString(),
    competition: p.competition ?? null,
  };
}

/** Homepage day fixtures — competition is optional (lives on the parent group). */
export function previewFromDayFixture(
  f: DayFixture,
  competition?: { name: Record<string, string>; slug: string } | null,
): MatchHeaderPreview {
  return {
    homeTeam: normalizeTeam(f.homeTeam as TeamSnapshot | null),
    awayTeam: normalizeTeam(f.awayTeam as TeamSnapshot | null),
    homeScore: f.homeScore,
    awayScore: f.awayScore,
    statusCode: f.statusCode,
    minute: f.minute,
    kickoffAt: f.kickoffAt.toISOString(),
    competition: competition ?? null,
  };
}

/** Live ticker — carries competition directly. */
export function previewFromTickerFixture(f: TickerFixture): MatchHeaderPreview {
  return {
    homeTeam: normalizeTeam(f.homeTeam),
    awayTeam: normalizeTeam(f.awayTeam),
    homeScore: f.homeScore,
    awayScore: f.awayScore,
    statusCode: f.statusCode,
    minute: f.minute,
    kickoffAt: f.kickoffAt.toISOString(),
    competition: { name: f.competition.name, slug: f.competition.slug },
  };
}

/** Canonical match page — seed on render so back/forward nav stays warm. */
export function previewFromMatchDetail(m: MatchDetail): MatchHeaderPreview {
  return {
    homeTeam: normalizeTeam(m.homeTeam),
    awayTeam: normalizeTeam(m.awayTeam),
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    statusCode: m.statusCode,
    minute: m.minute,
    kickoffAt: m.kickoffAt.toISOString(),
    competition: { name: m.competition.name, slug: m.competition.slug },
  };
}
