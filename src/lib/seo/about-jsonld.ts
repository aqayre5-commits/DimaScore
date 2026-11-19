import { buildGraph, organizationId, webSiteId, type JsonLdGraph } from '@/lib/seo/jsonld';

/** The company that operates DimaScore (Companies House, England and Wales). */
export const OPERATOR = {
  legalName: 'REN Technology Limited',
  companyNumber: '13694812',
} as const;

export const operatorId = (baseUrl: string): string => `${baseUrl}/#operator`;

/**
 * AboutPage graph for /{locale}/about: the page, the operating company, and a link from the
 * sitewide DimaScore organization node (same @id, so it merges) to that company.
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
    {
      '@type': 'NewsMediaOrganization',
      '@id': organizationId(baseUrl),
      name: 'DimaScore',
      url: `${baseUrl}/`,
      parentOrganization: { '@id': operatorId(baseUrl) },
    },
    {
      '@type': 'Organization',
      '@id': operatorId(baseUrl),
      name: OPERATOR.legalName,
      legalName: OPERATOR.legalName,
      identifier: {
        '@type': 'PropertyValue',
        propertyID: 'Companies House company number',
        value: OPERATOR.companyNumber,
      },
      address: { '@type': 'PostalAddress', addressCountry: 'GB' },
    },
  );
}
