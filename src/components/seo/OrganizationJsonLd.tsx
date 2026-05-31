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
    name: 'DimaScore',
    url: baseUrl,
    logo: `${baseUrl}/dimascore-logo.svg`,
    sameAs: [
      'https://x.com/dimascore',
      'https://www.instagram.com/dimascore',
      'https://www.youtube.com/@dimascore',
      'https://www.tiktok.com/@dimascore',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
