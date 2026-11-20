import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from './routing';
import type { Locale } from './config';

/**
 * Narrow a raw `[locale]` route param to a supported Locale, or 404.
 *
 * `dynamicParams = false` is not available with Cache Components, so any
 * single-segment path that the middleware matcher does not catch (e.g.
 * `/llms.txt`, `/ads.txt`, `/xmlrpc.php`) is rendered as `[locale]` = that
 * string. Call this at the top of every `generateMetadata` / page / layout that
 * uses the locale, before it reaches Intl APIs (which throw a RangeError on
 * invalid tags like "llms.txt" and turned those requests into 500s).
 */
export function requireLocale(locale: string): Locale {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  return locale;
}
