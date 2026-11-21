/**
 * Typed JSON-LD @graph builder. Pure, framework-free node builders + a graph assembler that
 * emits a single { "@context", "@graph": [...] } linked by stable @ids. Rendered server-side via
 * <JsonLd> (never from generateMetadata, where JSON-LD is silently ignored).
 *
 * Task 15.3 ships the sitewide nodes (Organization + WebSite). Per-page entity nodes
 * (SportsEvent, SportsTeam, Athlete, BreadcrumbList) are added in 15.4 and reference these @ids.
 *
 * Types are hand-declared (no schema-dts dependency) — the node set is small and the shapes are
 * pinned to what Google documents.
 */

import { buildMatchSlug } from '@/lib/seo/match-slug';
import { matchupLabel } from '@/lib/i18n/feed-labels';
import { SOCIAL_ALLOWLIST } from '@/lib/constants/social-links';

export interface JsonLdNode {
  '@type': string | string[];
  '@id'?: string;
  [key: string]: unknown;
}

export interface JsonLdGraph {
  '@context': 'https://schema.org';
  '@graph': JsonLdNode[];
}

/** Stable @ids so nodes across the sitewide graph and per-page graphs reconcile to one entity. */
export const organizationId = (baseUrl: string): string => `${baseUrl}/#organization`;
export const webSiteId = (baseUrl: string): string => `${baseUrl}/#website`;
export const founderId = (baseUrl: string): string => `${baseUrl}/#founder`;

/** Role as the About page words it in each language (the JSON-LD must match the visible text). */
const FOUNDER_JOB_TITLE: Record<string, string> = {
  en: 'Founder and Editor',
  fr: 'Fondateur et éditeur',
  ar: 'المؤسس والمحرّر',
};

/**
 * Founder and editor. Emitted on /about only, the one page whose visible text names him (Google:
 * mark up only what the page shows). Name and role only; the role follows the page language and
 * falls back to English.
 */
export function buildFounder(baseUrl: string, locale = 'en'): JsonLdNode {
  return {
    '@type': 'Person',
    '@id': founderId(baseUrl),
    name: 'Abdilahi Qayre',
    jobTitle: FOUNDER_JOB_TITLE[locale] ?? FOUNDER_JOB_TITLE.en,
  };
}

/** Publisher / brand entity — sitewide, identical on every page. */
export function buildOrganization(baseUrl: string): JsonLdNode {
  return {
    '@type': 'NewsMediaOrganization',
    '@id': organizationId(baseUrl),
    name: 'DimaScore',
    url: `${baseUrl}/`,
    logo: { '@type': 'ImageObject', url: `${baseUrl}/dimascore-logo.svg` },
    // Only confirmed accounts (X, Facebook Page); same list as the footer (constants/social-links).
    // Instagram/YouTube/TikTok @dimascore are unconfirmed — omitted.
    sameAs: [...SOCIAL_ALLOWLIST],
  };
}

/**
 * WebSite node. No SearchAction: site search is the header modal (`/api/v1/search`), and
 * `/{locale}/recherche` is not a page, so a SearchAction target would 404.
 */
export function buildWebSite(baseUrl: string, locale: string): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': webSiteId(baseUrl),
    url: `${baseUrl}/${locale}`,
    name: 'DimaScore',
    alternateName: ['ديماسكور', 'DimaScore'],
    inLanguage: ['fr-MA', 'ar-MA', 'en'],
    publisher: { '@id': organizationId(baseUrl) },
  };
}

/** Assemble one graph. Falsy nodes are dropped so callers can conditionally include entities. */
export function buildGraph(...nodes: (JsonLdNode | null | undefined | false)[]): JsonLdGraph {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes.filter((n): n is JsonLdNode => Boolean(n)),
  };
}

// ── Per-page nodes (Task 15.4) ─────────────────────────────────────────────
// Each page emits ONE graph: a WebPage anchor + its entity + a BreadcrumbList,
// all linked by @id back to the sitewide #organization / #website nodes.

/** BCP-47 tag for a UI locale, matching the sitewide WebSite.inLanguage set. */
const bcp47 = (locale: string): string =>
  locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en' : 'fr-MA';

/** Stable per-page @ids (url is the page's canonical, locale-scoped URL). */
export const webPageId = (url: string): string => `${url}#webpage`;
const breadcrumbId = (url: string): string => `${url}#breadcrumb`;

/**
 * schema.org EventStatusType only lists EventCancelled, EventMovedOnline, EventPostponed,
 * EventRescheduled and EventScheduled. A match that was played (FT/AET/PEN), awarded or
 * a walkover took place as scheduled, so it stays EventScheduled. Postponed is
 * EventPostponed. Cancelled and abandoned are EventCancelled. Suspended has no enum
 * value; the page label is "Suspended", so it stays EventScheduled rather than postponed.
 */
export function sportsEventStatus(statusCode: string): string {
  if (statusCode === 'PST') return 'https://schema.org/EventPostponed';
  if (statusCode === 'CANC' || statusCode === 'ABD') return 'https://schema.org/EventCancelled';
  return 'https://schema.org/EventScheduled';
}

export interface BreadcrumbNodeSegment {
  label: string;
  href?: string;
}

/**
 * BreadcrumbList node from the visible trail. Mirrors the rules in SeoBreadcrumb: drop non-last
 * hrefless nodes and renumber; emit `item` as an absolute URL. Returns null when nothing remains.
 */
export function buildBreadcrumbList(
  segments: readonly BreadcrumbNodeSegment[],
  pageUrl: string,
  baseUrl: string,
): JsonLdNode | null {
  const schemaSegments = segments.filter((seg, i) => seg.href || i === segments.length - 1);
  if (schemaSegments.length === 0) return null;
  return {
    '@type': 'BreadcrumbList',
    '@id': breadcrumbId(pageUrl),
    itemListElement: schemaSegments.map((seg, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: seg.label,
      ...(seg.href
        ? { item: seg.href.startsWith('http') ? seg.href : `${baseUrl}${seg.href}` }
        : {}),
    })),
  };
}

/** WebPage anchor node — links the page to the sitewide WebSite and its own breadcrumb. */
export function buildWebPage(args: {
  url: string;
  name: string;
  locale: string;
  baseUrl: string;
  /** WebPage subtype — e.g. 'CollectionPage' for league/competition hubs. Defaults to 'WebPage'. */
  type?: string;
  hasBreadcrumb?: boolean;
  primaryImage?: string | null;
  /** @id of the node this page is primarily about — e.g. a hub's fixtures ItemList. */
  mainEntityId?: string;
}): JsonLdNode {
  return {
    '@type': args.type ?? 'WebPage',
    '@id': webPageId(args.url),
    url: args.url,
    name: args.name,
    inLanguage: bcp47(args.locale),
    isPartOf: { '@id': webSiteId(args.baseUrl) },
    ...(args.mainEntityId ? { mainEntity: { '@id': args.mainEntityId } } : {}),
    ...(args.hasBreadcrumb ? { breadcrumb: { '@id': breadcrumbId(args.url) } } : {}),
    ...(args.primaryImage
      ? { primaryImageOfPage: { '@type': 'ImageObject', url: args.primaryImage } }
      : {}),
  };
}

/**
 * Per-match SportsEvent. The score stays on the page: SportsEvent, Event and Thing have no
 * score property, so none is emitted here.
 */
export function buildSportsEventMatch(args: {
  url: string;
  homeName: string;
  awayName: string;
  /** Visible heading. Defaults to "Home vs Away" (in `locale`) when the caller has no on-page H1. */
  name?: string;
  /** Page language, for the default name's connector ("vs" / "ضد"). */
  locale?: string;
  /** A visible sentence about the match (the answer block). */
  description?: string | null;
  homeLogo?: string | null;
  awayLogo?: string | null;
  /** Team pages the visible team names link to. */
  homeUrl?: string | null;
  awayUrl?: string | null;
  competitionName: string;
  kickoffAt: Date;
  statusCode: string;
  venueName?: string | null;
  venueCity?: string | null;
  homeSameAs?: string[];
  awaySameAs?: string[];
  competitionSameAs?: string[];
}): JsonLdNode {
  const team = (
    side: 'home' | 'away',
    name: string,
    logo?: string | null,
    teamUrl?: string | null,
    sameAs?: string[],
  ): JsonLdNode => ({
    '@type': 'SportsTeam',
    '@id': `${args.url}#${side}-team`,
    name,
    ...(logo ? { logo } : {}),
    ...(teamUrl ? { url: teamUrl } : {}),
    ...(sameAs && sameAs.length > 0 ? { sameAs } : {}),
  });
  const home = team('home', args.homeName, args.homeLogo, args.homeUrl, args.homeSameAs);
  const away = team('away', args.awayName, args.awayLogo, args.awayUrl, args.awaySameAs);
  const ref = (n: JsonLdNode) => ({ '@id': n['@id'] as string });
  const images = [args.homeLogo, args.awayLogo].filter((x): x is string => !!x);
  // Only what the page shows: the venue strip (name, city), the crests, the answer sentence. No
  // score property (the visible H1 carries it), no organizer/offers/endDate (we don't have them).
  return {
    '@type': 'SportsEvent',
    '@id': `${args.url}#event`,
    name: args.name ?? matchupLabel(args.homeName, args.awayName, args.locale ?? 'en'),
    ...(args.description ? { description: args.description } : {}),
    sport: 'https://schema.org/Soccer',
    startDate: args.kickoffAt.toISOString(),
    eventStatus: sportsEventStatus(args.statusCode),
    mainEntityOfPage: { '@id': webPageId(args.url) },
    ...(images.length > 0 ? { image: images } : {}),
    homeTeam: ref(home),
    awayTeam: ref(away),
    competitor: [home, away],
    performer: [ref(home), ref(away)],
    ...(args.venueName
      ? {
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: {
            '@type': 'Place',
            name: args.venueName,
            ...(args.venueCity
              ? { address: { '@type': 'PostalAddress', addressLocality: args.venueCity } }
              : {}),
          },
        }
      : {}),
    superEvent: {
      '@type': 'SportsOrganization',
      name: args.competitionName,
      ...(args.competitionSameAs && args.competitionSameAs.length > 0
        ? { sameAs: args.competitionSameAs }
        : {}),
    },
    url: args.url,
  };
}

/** SportsTeam node for team pages — club / national-team entity. */
export function buildSportsTeam(args: {
  url: string;
  name: string;
  logo?: string | null;
  competitionName?: string | null;
  sameAs?: string[];
}): JsonLdNode {
  return {
    '@type': 'SportsTeam',
    '@id': `${args.url}#team`,
    name: args.name,
    sport: 'https://schema.org/Soccer',
    mainEntityOfPage: { '@id': webPageId(args.url) },
    ...(args.logo ? { logo: args.logo } : {}),
    ...(args.competitionName
      ? { memberOf: { '@type': 'SportsOrganization', name: args.competitionName } }
      : {}),
    ...(args.sameAs && args.sameAs.length > 0 ? { sameAs: args.sameAs } : {}),
    url: args.url,
  };
}

/** Person node for player & coach pages. */
export function buildPerson(args: {
  url: string;
  name: string;
  nationality?: string | null;
  image?: string | null;
  affiliation?: string | null;
  jobTitle?: string | null;
}): JsonLdNode {
  return {
    '@type': 'Person',
    '@id': `${args.url}#person`,
    name: args.name,
    mainEntityOfPage: { '@id': webPageId(args.url) },
    ...(args.jobTitle ? { jobTitle: args.jobTitle } : {}),
    ...(args.nationality ? { nationality: { '@type': 'Country', name: args.nationality } } : {}),
    ...(args.affiliation ? { affiliation: { '@type': 'SportsTeam', name: args.affiliation } } : {}),
    ...(args.image ? { image: args.image } : {}),
    url: args.url,
  };
}

const HOST_COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  MX: 'Mexico',
  MA: 'Morocco',
};

/** Tournament-level SportsEvent for cup pages. */
export function buildSportsEventTournament(args: {
  url: string;
  tournamentName: string;
  alternateNames: string[];
  kickoffDate: string;
  finalDate: string;
  hostCountryCodes: string[];
  sameAs?: string[];
}): JsonLdNode {
  return {
    '@type': 'SportsEvent',
    '@id': `${args.url}#event`,
    name: args.tournamentName,
    alternateName: args.alternateNames,
    sport: 'https://schema.org/Soccer',
    startDate: args.kickoffDate,
    endDate: args.finalDate,
    mainEntityOfPage: { '@id': webPageId(args.url) },
    location: args.hostCountryCodes.map((code) => ({
      '@type': 'Country',
      name: HOST_COUNTRY_NAMES[code] ?? code,
    })),
    organizer: { '@type': 'Organization', name: 'FIFA' },
    ...(args.sameAs && args.sameAs.length > 0 ? { sameAs: args.sameAs } : {}),
    url: args.url,
  };
}

/** Minimal fixture shape for the hub ItemList — resolved names + kickoff + status + team slugs. */
export interface FixtureListItem {
  id: number;
  kickoffAt: Date;
  statusCode: string;
  homeName: string;
  awayName: string;
  /** Stored team slugs (`name-id`) → the compact node's URL matches the per-match page's slug URL. */
  homeSlug: string | null;
  awaySlug: string | null;
}

/**
 * ItemList of a hub's season fixtures, each a compact SportsEvent that reconciles by @id with the
 * per-match page's own SportsEvent node. Returns null for an empty list. Kept compact (no logos /
 * competitors) since a full season can be hundreds of entries.
 *
 * The @id/url use the canonical slug URL (`/match/{home}-{away}-{id}`, via buildMatchSlug) so each
 * compact SportsEvent reconciles by @id with the per-match page's own SportsEvent node — which moved
 * to the slug URL in Task D.
 */
export function buildFixtureItemList(args: {
  fixtures: readonly FixtureListItem[];
  locale: string;
  baseUrl: string;
  pageUrl: string;
}): JsonLdNode | null {
  if (args.fixtures.length === 0) return null;
  return {
    '@type': 'ItemList',
    '@id': `${args.pageUrl}#fixtures`,
    numberOfItems: args.fixtures.length,
    itemListElement: args.fixtures.map((f, i) => {
      const matchUrl = `${args.baseUrl}/${args.locale}/match/${buildMatchSlug(f.homeSlug, f.awaySlug, f.id)}`;
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'SportsEvent',
          '@id': `${matchUrl}#event`,
          name: matchupLabel(f.homeName, f.awayName, args.locale),
          sport: 'https://schema.org/Soccer',
          startDate: f.kickoffAt.toISOString(),
          eventStatus: sportsEventStatus(f.statusCode),
          url: matchUrl,
        },
      };
    }),
  };
}

/** FAQPage node. Returns null for an empty FAQ set. */
export function buildFaqPage(
  faqs: readonly { question: string; answer: string }[],
  pageUrl: string,
): JsonLdNode | null {
  if (faqs.length === 0) return null;
  return {
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

/** NewsArticle (match recap) — a supported rich result. Linked to the WebPage + SportsEvent by @id. */
export function buildNewsArticle(args: {
  url: string;
  baseUrl: string;
  headline: string;
  body: string;
  datePublished: string;
  dateModified?: string;
  image?: string | null;
}): JsonLdNode {
  return {
    '@type': 'NewsArticle',
    '@id': `${args.url}#recap`,
    headline: args.headline,
    articleBody: args.body,
    datePublished: args.datePublished,
    dateModified: args.dateModified ?? args.datePublished,
    author: { '@id': organizationId(args.baseUrl) },
    publisher: { '@id': organizationId(args.baseUrl) },
    mainEntityOfPage: { '@id': webPageId(args.url) },
    about: { '@id': `${args.url}#event` },
    ...(args.image ? { image: [args.image] } : {}),
  };
}

/**
 * VideoObject (match highlights) — a supported rich result. Only emit with a REAL hosted video
 * (YouTube here); a fabricated contentUrl is a schema violation, so callers gate on actual data.
 */
export function buildVideoObject(args: {
  url: string;
  youtubeId: string;
  name: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  uploadDate: string;
  durationSeconds?: number | null;
}): JsonLdNode {
  const iso =
    args.durationSeconds && args.durationSeconds > 0
      ? `PT${Math.floor(args.durationSeconds / 60)}M${args.durationSeconds % 60}S`
      : undefined;
  return {
    '@type': 'VideoObject',
    '@id': `${args.url}#highlights`,
    name: args.name,
    description: args.description ?? args.name,
    thumbnailUrl: args.thumbnailUrl ?? `https://i.ytimg.com/vi/${args.youtubeId}/hqdefault.jpg`,
    uploadDate: args.uploadDate,
    contentUrl: `https://www.youtube.com/watch?v=${args.youtubeId}`,
    embedUrl: `https://www.youtube.com/embed/${args.youtubeId}`,
    ...(iso ? { duration: iso } : {}),
  };
}
