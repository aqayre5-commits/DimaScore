'use client';

import { useRef, type ComponentProps } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type IntentLinkProps = Omit<ComponentProps<typeof Link>, 'prefetch'>;

/**
 * Internal link that navigates client-side (no full document reload) and warms the destination on
 * intent — pointer-enter, keyboard focus or the first touch — instead of on viewport entry.
 *
 * Use it for long lists of links (the competition rail has ~60 rows, a standings table has 20
 * team links): viewport auto-prefetch would fetch every row on load and compete with the page's
 * own resources, while `prefetch={false}` alone would leave the first click cold. Intent warms
 * exactly the row the visitor is about to open, a few hundred ms before the click, and
 * `router.prefetch` is deduplicated by the client router, so repeats are free.
 *
 * Plain `<a href>` to an internal route is a full document load (~0.9 MB HTML + JS re-parse +
 * hydration for a competition page); this keeps the shell mounted and only fetches the RSC payload.
 */
export function IntentLink({
  href,
  onPointerEnter,
  onFocus,
  onTouchStart,
  ...rest
}: IntentLinkProps) {
  const router = useRouter();
  const warmed = useRef(false);

  const warm = () => {
    if (warmed.current) return;
    warmed.current = true;
    const target = typeof href === 'string' ? href : href.pathname;
    if (target && target.startsWith('/')) router.prefetch(target);
  };

  return (
    <Link
      {...rest}
      href={href}
      prefetch={false}
      onPointerEnter={(e) => {
        warm();
        onPointerEnter?.(e);
      }}
      onFocus={(e) => {
        warm();
        onFocus?.(e);
      }}
      onTouchStart={(e) => {
        warm();
        onTouchStart?.(e);
      }}
    />
  );
}
