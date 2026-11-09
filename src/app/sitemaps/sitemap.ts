import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { parseChunkId } from '@/lib/seo/sitemap/chunks';
import { getChunkEntries, getSitemapChunks } from '@/lib/seo/sitemap/data';

/**
 * Chunked sitemap files at /sitemaps/sitemap/<id>.xml (static, teams, players[-N],
 * matches-YYYY-MM[-N]), each capped at CHUNK_SIZE (10k) URLs. The index that lists them is the
 * hand-written /sitemap-index.xml route (Next's auto-generated index for generateSitemaps 500s
 * under this setup, so we never rely on it).
 */
export async function generateSitemaps() {
  try {
    return (await getSitemapChunks()).map((c) => ({ id: c.id }));
  } catch {
    // DB unreachable (e.g. at build): only the static chunk is prerender-listed; the handler
    // re-runs generateSitemaps() per request, so the full list is used at runtime.
    return [{ id: 'static' }];
  }
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  // Always fresh from the DB at request time (never baked at build).
  await connection();
  const chunk = parseChunkId(await props.id);
  if (!chunk) return [];
  return getChunkEntries(chunk);
}
