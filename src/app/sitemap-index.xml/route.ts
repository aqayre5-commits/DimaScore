import { connection } from 'next/server';
import { BASE_URL } from '@/lib/constants/site';
import { renderSitemapIndex } from '@/lib/seo/sitemap/chunks';
import { getSitemapIndexEntries } from '@/lib/seo/sitemap/data';

/**
 * Hand-written sitemap index listing every chunk file under /sitemaps/sitemap/<id>.xml.
 * Also served at /sitemap.xml (see ../sitemap.xml/route.ts) so the URL already submitted in
 * Search Console keeps working and now resolves to the index instead of one oversized file.
 */
export async function GET(): Promise<Response> {
  await connection();
  const chunks = await getSitemapIndexEntries();
  return new Response(renderSitemapIndex(BASE_URL, chunks), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
