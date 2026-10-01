import { notFound } from 'next/navigation';

/**
 * Catch-all for unmatched paths under a valid locale (e.g. /fr/typo, /ar/old-link). Without this,
 * such URLs fall through to Next's built-in, unbranded, English root not-found. Throwing notFound()
 * here renders the localized, branded [locale]/not-found.tsx with full chrome instead.
 */
export default function LocaleCatchAll() {
  notFound();
}
