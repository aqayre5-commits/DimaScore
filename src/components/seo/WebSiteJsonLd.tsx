interface WebSiteJsonLdProps {
  baseUrl: string;
  locale: string;
}

/**
 * WebSite + SearchAction JSON-LD for the homepage.
 * Enables Google sitelinks search box eligibility.
 * Per homepage.md §3.
 */
export function WebSiteJsonLd({ baseUrl, locale }: WebSiteJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DimaScore',
    alternateName: ['ديماسكور', 'DimaScore'],
    url: `${baseUrl}/${locale}`,
    inLanguage: ['fr', 'en', 'ar'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/${locale}/recherche?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
