/**
 * Namespaces read on the client via `useTranslations(...)`.
 *
 * The full message files (38–56 KB) were serialised into every page's HTML/RSC
 * payload ahead of the main content, although most namespaces (Botola landing
 * pages, Lions abroad, style guide, …) are only read on the server through
 * `getTranslations`. Shipping just the hook namespaces shrinks the HTML that has
 * to be parsed before the streamed main content is revealed (match LCP).
 *
 * `tests/unit/i18n-client-messages.test.ts` fails if a client translation hook names a
 * namespace that is not listed here.
 */
export const CLIENT_MESSAGE_NAMESPACES = [
  'app',
  'chrome',
  'coachPage',
  'competition',
  // Still read by CookieNotice on main; drop this entry once #23 (removes the notice) lands.
  'cookieNotice',
  'dateStrip',
  'domesticCup',
  'fixtureList',
  'footer',
  'homepage',
  'leaguePage',
  'matchCentre',
  'matchDetail',
  'megaMenu',
  'mobileTabBar',
  'nav',
  'playerPage',
  'search',
  'shared',
  'teamPage',
  'theme',
  'topNav',
  'topStrip',
  'topbar',
  'tournament',
] as const;

export function pickClientMessages<T extends Record<string, unknown>>(messages: T): Partial<T> {
  const out: Partial<T> = {};
  for (const ns of CLIENT_MESSAGE_NAMESPACES) {
    if (ns in messages) (out as Record<string, unknown>)[ns] = messages[ns];
  }
  return out;
}
