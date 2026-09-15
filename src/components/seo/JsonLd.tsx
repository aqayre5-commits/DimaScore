import type { JsonLdGraph } from '@/lib/seo/jsonld';

/**
 * Renders one JSON-LD @graph as a server-side <script>. Server component (no 'use client') so the
 * markup is in the initial HTML for Googlebot without executing client JS. `<` is escaped to
 * < to prevent the script tag from being broken out of (XSS-safe).
 */
export function JsonLd({ graph }: { graph: JsonLdGraph }) {
  const json = JSON.stringify(graph).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
