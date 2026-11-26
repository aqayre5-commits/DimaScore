/**
 * next-intl's Link header sets hreflang x-default to the *unprefixed* path
 * (`https://dimascore.ma/match/…`), which then 307s based on Accept-Language.
 * The English URL in the same header is the x-default (English is the default
 * language). fr/en/ar entries are left as the middleware emitted them, so each
 * locale still points at the others.
 */
export function pointXDefaultAtEnglish(link: string): string {
  if (!/hreflang="x-default"/i.test(link)) return link;
  const parts = link.split(/,(?=\s*<)/);
  const english = parts.find((part) => /hreflang="en"/i.test(part));
  const englishUrl = english?.match(/<([^>]+)>/)?.[1];
  if (!englishUrl) return link;
  return parts
    .map((part) =>
      /hreflang="x-default"/i.test(part) ? part.replace(/<[^>]+>/, `<${englishUrl}>`) : part,
    )
    .join(', ');
}

/** next-intl swaps only the locale prefix, so it would invent /ar/club/.... Point ar at the existing /ar/equipe page. */
export function pointArabicTeamAlternate(link: string, equipeUrl: string): string {
  if (!/hreflang="ar"/i.test(link)) return link;
  const parts = link.split(/,(?=\s*<)/);
  return parts
    .map((part) => (/hreflang="ar"/i.test(part) ? part.replace(/<[^>]+>/, `<${equipeUrl}>`) : part))
    .join(', ');
}
