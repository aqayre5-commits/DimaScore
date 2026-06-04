import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface SeoBreadcrumbProps {
  segments: BreadcrumbSegment[];
  /**
   * When true, render a smaller, fainter row on mobile to reclaim space
   * (reverts to the default size at md+). The JSON-LD is unaffected.
   */
  compactOnMobile?: boolean;
}

/**
 * SEO breadcrumb with schema.org BreadcrumbList JSON-LD.
 * Last segment is non-clickable (current page). ~22px total height.
 * Server component — no 'use client' needed.
 */
export function SeoBreadcrumb({ segments, compactOnMobile = false }: SeoBreadcrumbProps) {
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
    <nav
      aria-label="breadcrumb"
      className={cn('px-4', compactOnMobile ? 'py-0.5 md:py-1' : 'py-1')}
    >
      <ol
        className={cn(
          'flex items-center gap-1.5',
          compactOnMobile
            ? 'text-[11px] text-text-tertiary md:text-[13px] md:text-text-secondary'
            : 'text-[13px] text-text-secondary',
        )}
      >
        {segments.map((seg, i) => (
          <li
            key={i}
            className={cn(
              'flex items-center gap-1',
              !compactOnMobile && i > 0 && i < segments.length - 1 && 'hidden md:flex',
            )}
          >
            {i > 0 && (
              <span aria-hidden="true" className="text-text-tertiary">
                ›
              </span>
            )}
            {seg.href ? (
              <Link
                href={seg.href}
                className="transition-colors hover:text-text-primary hover:underline"
              >
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
