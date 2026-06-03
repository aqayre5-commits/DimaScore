'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { usePrefetchMatch } from '@/hooks/usePrefetchMatch';
import type { MatchHeaderPreview } from '@/lib/match-header-preview';

interface MatchLinkProps {
  matchId: string;
  href: string;
  preview: MatchHeaderPreview;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  dir?: 'rtl' | 'ltr';
  /** Also warm the fuller match summary (qk.match) on intent. */
  prefetchIntent?: boolean;
}

/**
 * Centralized match link. Seeds qk.matchHeader(id) with a partial-header preview
 * so the /match/[id] loading.tsx can paint a real header instead of a skeleton.
 *
 * Seeds on intent (pointer-enter / focus / touch) AND on pointer-down / click —
 * the click seed closes the fast-tap-before-hover edge case without writing the
 * cache for every off-screen row. setQueryData is idempotent, so repeats are free.
 *
 * Keeps prefetch={false}: the dynamic match route only partially prefetches
 * anyway; the header preview is what makes the transition feel instant.
 */
export function MatchLink({
  matchId,
  href,
  preview,
  children,
  className,
  ariaLabel,
  dir,
  prefetchIntent,
}: MatchLinkProps) {
  const queryClient = useQueryClient();
  const summaryPrefetch = usePrefetchMatch(matchId);

  const seed = () => {
    queryClient.setQueryData(qk.matchHeader(matchId), preview);
    if (prefetchIntent) summaryPrefetch.onMouseEnter();
  };

  return (
    <Link
      href={href}
      prefetch={false}
      className={className}
      aria-label={ariaLabel}
      dir={dir}
      onPointerEnter={seed}
      onFocus={seed}
      onTouchStart={seed}
      onPointerDown={seed}
      onClick={seed}
    >
      {children}
    </Link>
  );
}
