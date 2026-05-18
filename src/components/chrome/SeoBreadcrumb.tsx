import Link from 'next/link';

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface SeoBreadcrumbProps {
  segments: BreadcrumbSegment[];
}

/**
 * SEO breadcrumb with schema.org BreadcrumbList JSON-LD.
 * Last segment is non-clickable (current page). ~22px total height.
 * Server component — no 'use client' needed.
 */
export function SeoBreadcrumb({ segments }: SeoBreadcrumbProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: segments.map((seg, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: seg.label,
      ...(seg.href ? { item: seg.href } : {}),
    })),
  };

  return (
    <nav aria-label="breadcrumb" className="px-4 py-1">
      <ol className="flex items-center gap-1 text-sm text-text-secondary">
        {segments.map((seg, i) => (
          <li
            key={i}
            className={`flex items-center gap-1${i > 0 && i < segments.length - 1 ? ' hidden md:flex' : ''}`}
          >
            {i > 0 && (
              <span aria-hidden="true" className="text-text-tertiary">
                ›
              </span>
            )}
            {seg.href ? (
              <Link href={seg.href} className="transition-colors hover:text-text-secondary">
                {seg.label}
              </Link>
            ) : (
              <span aria-current={i === segments.length - 1 ? 'page' : undefined}>{seg.label}</span>
            )}
          </li>
        ))}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </nav>
  );
}
