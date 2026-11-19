/**
 * next-intl's Link header sets hreflang x-default to the *unprefixed* path
 * (`https://dimascore.ma/match/…`), which then 307s based on Accept-Language.
 * The French URL in the same header is the x-default the site actually wants.
 * fr/en/ar entries are left as the middleware emitted them, so each locale still
 * points at the others.
 */
export function pointXDefaultAtFrench(link: string): string {
  if (!/hreflang="x-default"/i.test(link)) return link;
  const parts = link.split(/,(?=\s*<)/);
  const french = parts.find((part) => /hreflang="fr"/i.test(part));
  const frenchUrl = french?.match(/<([^>]+)>/)?.[1];
  if (!frenchUrl) return link;
  return parts
    .map((part) =>
      /hreflang="x-default"/i.test(part) ? part.replace(/<[^>]+>/, `<${frenchUrl}>`) : part,
    )
    .join(', ');
}
