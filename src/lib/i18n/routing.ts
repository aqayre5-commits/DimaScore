import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Never 307 `/` (or any other path) from Accept-Language. Crawlers must get one
  // stable response; `/` is a 308 to /fr in middleware. Visitors pick en/ar from the URL.
  localeDetection: false,
  localeCookie: false,
});
