import { buildGraph, organizationId, webSiteId, type JsonLdGraph } from '@/lib/seo/jsonld';

/**
 * AboutPage graph for /{locale}/about. The organization it is about is the sitewide DimaScore node
 * (`/#organization`: name, url, logo, sameAs X) already on every page, so no other entity is added
 * here: the operator is an individual sole operator and is deliberately not named.
 */
export function buildAboutPageGraph(
  baseUrl: string,
  locale: string,
  content: { title: string; description: string },
): JsonLdGraph {
  return buildGraph({
    '@type': 'AboutPage',
    '@id': `${baseUrl}/${locale}/about#page`,
    url: `${baseUrl}/${locale}/about`,
    name: content.title,
    description: content.description,
    inLanguage: locale,
    isPartOf: { '@id': webSiteId(baseUrl) },
    about: { '@id': organizationId(baseUrl) },
  });
}
