/**
 * Crawlable URL helpers for competition, qualifier/round, and national-team
 * category pages. Selectors are not used (D2/D4, 25 Nov 2026 17:40 Europe/London).
 *
 * Competition tabs `fixtures|standings|stats` already 301 to the hub
 * (see competition-tab-redirects.ts). These new segments must be real routes
 * in a later UI PR — they must not be swallowed by `[season]`.
 */

import type { Locale } from '@/lib/i18n/config';
import { slugify } from '@/lib/ingestion/slug';
import { canonicalRoundLabel } from '@/lib/competitions/round-labels';
import {
  buildCompetitionHref,
  findEntryByCompetitionId,
} from '@/lib/constants/competitions-mega-menu';

/** Hub path segment for all qualifying rounds that share a competition id (e.g. UCL). */
export const QUALIFYING_SEGMENT = 'qualifying';

/** Path segment for a single named round or matchday. */
export const ROUND_SEGMENT = 'round';

/** Words that already 301 to the competition hub and must not be reused as round slugs. */
export const RESERVED_COMPETITION_SEGMENTS = ['fixtures', 'standings', 'stats'] as const;

export function slugifyRound(roundLabel: string): string {
  const slug = slugify(canonicalRoundLabel(roundLabel));
  if ((RESERVED_COMPETITION_SEGMENTS as readonly string[]).includes(slug)) {
    return `round-${slug}`;
  }
  return slug;
}

/**
 * True for UEFA-style qualifying / preliminary rounds — not league-phase
 * "Knockout Round Play-offs" and not promotion/relegation play-offs.
 */
export function isQualifyingRound(roundLabel: string): boolean {
  const r = roundLabel.trim().toLowerCase();
  if (!r) return false;
  if (r.includes('knockout round play')) return false;
  if (/\b(promotion|relegation)\b/.test(r)) return false;
  return /\bqualifying\b|\bpreliminary\b/.test(r);
}

export function buildTeamHref(locale: Locale, slug: string): string {
  return `/${locale}/equipe/${slug}`;
}

export function buildCompetitionHubHref(competitionId: number, locale: Locale): string | null {
  const entry = findEntryByCompetitionId(competitionId);
  return entry ? buildCompetitionHref(entry, locale) : null;
}

export function buildQualifyingHref(competitionId: number, locale: Locale): string | null {
  const hub = buildCompetitionHubHref(competitionId, locale);
  return hub ? `${hub}/${QUALIFYING_SEGMENT}` : null;
}

export function buildRoundHref(
  competitionId: number,
  locale: Locale,
  roundLabel: string,
): string | null {
  const hub = buildCompetitionHubHref(competitionId, locale);
  if (!hub) return null;
  const slug = slugifyRound(roundLabel);
  if (!slug) return null;
  if (isQualifyingRound(roundLabel)) {
    return `${hub}/${QUALIFYING_SEGMENT}/${slug}`;
  }
  return `${hub}/${ROUND_SEGMENT}/${slug}`;
}

/** Ids a national-team category page needs (one URL per team id). */
export interface NationalTeamPageIds {
  teamId: number;
  slug: string;
  countryCode: string | null;
  nationalCategory: 'men' | 'women' | null;
  ageGroup: number | null;
  /** Other categories for the same country, already ingested. */
  siblingTeamIds: number[];
}

/** Ids a qualifier or named-round page needs. */
export interface QualifierPageIds {
  competitionId: number;
  seasonYear: number;
  /** API-Football round label, or the qualifying section hub. */
  round: string | typeof QUALIFYING_SEGMENT;
}
