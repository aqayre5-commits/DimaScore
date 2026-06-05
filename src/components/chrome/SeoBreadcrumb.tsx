import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface SeoBreadcrumbProps {
  segments: BreadcrumbSegment[];
  /**
   * Render a minimal, faint, single-line row at all breakpoints to reclaim
   * space. Kept visible for orientation/back-nav; the JSON-LD below is what
   * search engines consume and is unaffected by this flag.
   */
  compact?: boolean;
}

/**
 * SEO breadcrumb with schema.org BreadcrumbList JSON-LD.
 * Last segment is non-clickable (current page). Server component.
 */
export function SeoBreadcrumb({ segments, compact = false }: SeoBreadcrumbProps) {
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
    <nav aria-label="breadcrumb" className={cn('px-4', compact ? 'py-px' : 'py-1')}>
      <ol
        className={cn(
          'flex items-center',
          compact
            ? 'gap-0.5 text-[10px] leading-none text-text-quaternary'
            : 'gap-1.5 text-[13px] text-text-secondary',
        )}
      >
        {segments.map((seg, i) => (
          <li
            key={i}
            className={cn(
              'flex items-center gap-1',
              !compact && i > 0 && i < segments.length - 1 && 'hidden md:flex',
            )}
          >
            {i > 0 && (
              <span aria-hidden="true" className="text-text-quaternary">
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
