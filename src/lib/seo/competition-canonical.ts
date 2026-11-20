/**
 * Canonical competition path for a locale, and a 301 target when the request used
 * another locale's country or tournament slug (for example /en/.../maroc/botola-pro).
 * Botola Pro's Arabic canonical is the Latin hub, matching its hreflang cluster.
 */

import { locales, type Locale } from '@/lib/i18n/config';
import type { MegaMenuEntry } from '@/lib/constants/competitions-mega-menu';
import { getCountrySlug } from '@/lib/constants/country-slugs';
import {
  normalizeCompetitionSlug,
  resolveCompetitionEntry,
} from '@/lib/competitions/resolve-competition';
import { BOTOLA_PRO_COMPETITION_ID } from '@/lib/seo/botola-classement';
import { BOTOLA_COMPETITION_HUB } from '@/lib/seo/botola-season-opener';

export function canonicalCompetitionPath(entry: MegaMenuEntry, locale: Locale): string {
  if (entry.competitionId === BOTOLA_PRO_COMPETITION_ID) return BOTOLA_COMPETITION_HUB[locale];
  return `/${locale}/competition/${getCountrySlug(entry.countryKey, locale)}/${entry.slugs[locale]}`;
}

function comparable(path: string): string {
  return path
    .split('/')
    .map((seg) => normalizeCompetitionSlug(seg))
    .join('/');
}

const COMPETITION_PATH_RE = /^\/(fr|en|ar)\/competition\/([^/]+)\/([^/]+)(\/.*)?$/;

/** Pathname to 301 to, or null when the request is already canonical or not a known competition. */
export function canonicalCompetitionRedirect(pathname: string): string | null {
  let decoded = pathname;
  try {
    decoded = decodeURI(pathname);
  } catch {
    return null;
  }
  const match = COMPETITION_PATH_RE.exec(decoded);
  if (!match) return null;
  const locale = match[1] as Locale;
  if (!(locales as readonly string[]).includes(locale)) return null;
  const entry = resolveCompetitionEntry(match[3]);
  if (!entry) return null;
  const suffix = match[4] ?? '';
  const target = `${canonicalCompetitionPath(entry, locale)}${suffix}`;
  const requested = `/${locale}/competition/${match[2]}/${match[3]}${suffix}`;
  if (comparable(requested) === comparable(target)) return null;
  return target;
}
