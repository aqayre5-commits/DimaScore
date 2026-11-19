import {
  buildFounder,
  buildGraph,
  founderId,
  organizationId,
  webSiteId,
  type JsonLdGraph,
} from '@/lib/seo/jsonld';

/**
 * AboutPage graph for /{locale}/about. The organization it is about is the sitewide DimaScore node
 * (`/#organization`: name, url, logo, sameAs X), already on every page. The founder Person node and
 * the `founder` link on that organization are added here only, because the founder is named in the
 * visible About text and nowhere else.
 */
export function buildAboutPageGraph(
  baseUrl: string,
  locale: string,
  content: { title: string; description: string },
): JsonLdGraph {
  return buildGraph(
    {
      '@type': 'AboutPage',
      '@id': `${baseUrl}/${locale}/about#page`,
      url: `${baseUrl}/${locale}/about`,
      name: content.title,
      description: content.description,
      inLanguage: locale,
      isPartOf: { '@id': webSiteId(baseUrl) },
      about: { '@id': organizationId(baseUrl) },
    },
    buildFounder(baseUrl),
    // Same @id as the sitewide organization: JSON-LD merges the nodes, adding `founder`.
    {
      '@type': 'NewsMediaOrganization',
      '@id': organizationId(baseUrl),
      founder: { '@id': founderId(baseUrl) },
    },
  );
}
