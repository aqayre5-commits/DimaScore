/**
 * Classify a national-team side from its English name.
 * API-Football uses a separate team id per category; the feed does not link
 * them, so we infer gender and age group from the name (and an optional
 * is_women flag already stored on the row).
 */

import type { Locale } from '@/lib/i18n/config';
import { buildTeamHref } from './paths';

const AGE = /\bU-?(1[5-9]|2[0-3])\b/i;
const WOMEN_SUFFIX = /\s*\(?W(?:omen)?\)?\s*$/i;

export type NationalCategory = 'men' | 'women';

export interface NationalClassification {
  category: NationalCategory;
  /** 15–23 when the name carries a youth suffix; otherwise null (senior). */
  ageGroup: number | null;
}

export function classifyNationalTeamName(
  englishName: string,
  isWomenFlag = false,
): NationalClassification {
  const ageMatch = englishName.match(AGE);
  const ageGroup = ageMatch ? parseInt(ageMatch[1], 10) : null;
  const category: NationalCategory =
    isWomenFlag || WOMEN_SUFFIX.test(englishName) ? 'women' : 'men';
  return { category, ageGroup };
}

/** Strip youth/women suffixes so "France U21" and "France" share a family key. */
export function nationalFamilyBaseName(englishName: string): string {
  return englishName
    .replace(AGE, ' ')
    .replace(WOMEN_SUFFIX, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}


export interface NationalFamilyMember {
  teamId: number;
  slug: string;
  englishName: string;
  countryCode: string | null;
  isWomen?: boolean;
  /** When already stored (after migration 0008 + backfill). */
  nationalCategory?: 'men' | 'women' | null;
  ageGroup?: number | null;
  hasFixtures?: boolean;
}

export interface NationalCategoryLink {
  teamId: number;
  href: string;
  category: NationalCategory;
  ageGroup: number | null;
  slug: string;
  /** Short label such as "Men", "Women", "U21". */
  label: string;
}

export function categoryLabel(classification: NationalClassification): string {
  if (classification.ageGroup != null) {
    const age = `U${classification.ageGroup}`;
    return classification.category === 'women' ? `${age} women` : age;
  }
  return classification.category === 'women' ? 'Women' : 'Men';
}

function classifyMember(m: NationalFamilyMember): NationalClassification {
  if (m.nationalCategory) {
    return { category: m.nationalCategory, ageGroup: m.ageGroup ?? null };
  }
  return classifyNationalTeamName(m.englishName, m.isWomen ?? false);
}

/**
 * Crawlable links to every category in a national-team family that should be
 * listed (exists in the DB and, when known, has at least one fixture).
 * Sorted men senior → men youth (desc age) → women senior → women youth.
 */
export function nationalFamilyLinks(
  locale: Locale,
  members: NationalFamilyMember[],
): NationalCategoryLink[] {
  const links = members
    .filter((m) => m.hasFixtures !== false)
    .map((m) => {
      const classification = classifyMember(m);
      return {
        teamId: m.teamId,
        href: buildTeamHref(locale, m.slug),
        category: classification.category,
        ageGroup: classification.ageGroup,
        slug: m.slug,
        label: categoryLabel(classification),
      };
    });

  const rank = (l: NationalCategoryLink) =>
    (l.category === 'women' ? 100 : 0) + (l.ageGroup == null ? 0 : 50 - l.ageGroup);
  return links.sort((a, b) => rank(a) - rank(b) || a.teamId - b.teamId);
}

/** Group already-fetched national teams by country + family base name. */
export function groupNationalFamilies(
  members: NationalFamilyMember[],
): Map<string, NationalFamilyMember[]> {
  const map = new Map<string, NationalFamilyMember[]>();
  for (const m of members) {
    if (!m.countryCode) continue;
    const key = `${m.countryCode}:${nationalFamilyBaseName(m.englishName)}`;
    const list = map.get(key) ?? [];
    list.push(m);
    map.set(key, list);
  }
  return map;
}
