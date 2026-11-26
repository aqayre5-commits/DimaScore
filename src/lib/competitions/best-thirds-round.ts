/**
 * Whether `/round/best-thirds` is a real page for this competition edition.
 * Editions with no qualifying third-placed sides (bestThirdsAdvance 0 or absent)
 * have no such page — callers 404 before the cup template falls back to the groups view.
 */
import { locales, type Locale } from '@/lib/i18n/config';
import { resolveCompetitionEntry } from '@/lib/competitions/resolve-competition';
import { findEditionYearBySlug } from '@/lib/constants/cup-content';
import { getCompetitionFormat } from '@/lib/competitions/formats';
import { BEST_THIRDS_SLUG } from '@/lib/competitions/group-stage';

const PATH_RE = /^\/(fr|en|ar)\/competition\/([^/]+)\/([^/]+)(?:\/(\d{4}))?\/round\/([^/]+)\/?$/;

/** True when this pathname is a best-thirds URL that the edition does not use. */
export function isMissingBestThirdsPath(pathname: string): boolean {
  const match = PATH_RE.exec(pathname);
  if (!match) return false;
  const [, locale, , rawTournament, season, rawRound] = match;
  if (!(locales as readonly string[]).includes(locale as Locale)) return false;
  let tournament: string;
  let round: string;
  try {
    tournament = decodeURIComponent(rawTournament);
    round = decodeURIComponent(rawRound);
  } catch {
    return false;
  }
  if (round !== BEST_THIRDS_SLUG) return false;
  const entry = resolveCompetitionEntry(tournament);
  if (!entry) return false;
  const editionYear =
    findEditionYearBySlug(entry.competitionId, tournament) ??
    (season && Number.isFinite(Number(season)) ? Number(season) : undefined);
  const format = getCompetitionFormat(entry.competitionId, editionYear);
  if (!format) return false;
  return !(format.bestThirdsAdvance && format.bestThirdsAdvance > 0);
}
