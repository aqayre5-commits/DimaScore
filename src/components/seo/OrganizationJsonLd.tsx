interface OrganizationJsonLdProps {
  baseUrl: string;
}

/**
 * Organization JSON-LD for brand authority.
 * Per homepage.md §3.
 */
export function OrganizationJsonLd({ baseUrl }: OrganizationJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Atlas Kings',
    url: baseUrl,
    logo: `${baseUrl}/atlas-kings-logo.svg`,
    sameAs: [
      'https://x.com/atlaskings',
      'https://www.instagram.com/atlaskings',
      'https://www.youtube.com/@atlaskings',
      'https://www.tiktok.com/@atlaskings',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
