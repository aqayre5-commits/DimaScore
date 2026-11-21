import { ImageResponse } from 'next/og';
import type { ReactElement } from 'react';
import { OG_FONT_BASE64 } from './og-font-data';
import { OG_SIZE } from './og-size';
import { OG_STATIC_FALLBACK_PNG_BASE64 } from './og-static-fallback';

export { OG_SIZE };
export const OG_FONT_FAMILY = 'DimaScore OG';

/**
 * Cache-Control for OG images.
 * - DEFAULT is what Next sends for dynamic ImageResponse routes in production today (checked on
 *   the live /en match and locale images): every request revalidates.
 * - FINISHED is for a match that has ended: the image no longer changes, so the CDN may keep it
 *   for a day and serve it stale for a week while it refreshes. Browsers still revalidate.
 * Fallback images always get DEFAULT, so a transient failure is never cached at the edge.
 */
export const OG_CACHE_DEFAULT = 'public, max-age=0, must-revalidate';
export const OG_CACHE_FINISHED =
  'public, max-age=0, must-revalidate, s-maxage=86400, stale-while-revalidate=604800';

function decodeBase64(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

let fontData: ArrayBuffer | null = null;
function ogFont(): ArrayBuffer {
  if (!fontData) fontData = decodeBase64(OG_FONT_BASE64);
  return fontData;
}

/** Fonts for every OG image: the bundled Arabic + Latin subset, so Satori never downloads a
 *  fallback font at request time (see renderOgImage). */
export function ogFonts() {
  return [{ name: OG_FONT_FAMILY, data: ogFont(), weight: 700 as const, style: 'normal' as const }];
}

/** Last resort: a pre-encoded 1200×630 brand PNG (scripts/og-font/build-og-static-fallback.py). */
export function ogStaticFallbackPng(): ArrayBuffer {
  return decodeBase64(OG_STATIC_FALLBACK_PNG_BASE64);
}

async function renderPng(element: ReactElement): Promise<ArrayBuffer> {
  return new ImageResponse(element, { ...OG_SIZE, fonts: ogFonts() }).arrayBuffer();
}

function png(body: ArrayBuffer, cacheControl: string): Response {
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'image/png', 'cache-control': cacheControl },
  });
}

/**
 * Render an OG image to a finished PNG response. Never throws and always answers 200 image/png.
 *
 * ImageResponse renders inside its body stream, after the route handler has returned, so a render
 * error can't be caught by the route and surfaced on Cloudflare as a Worker exception (error 1101).
 * That is what the /ar competition image did: with no Arabic font supplied, @vercel/og fetched Noto
 * Sans Arabic from Google Fonts at request time, and opentype.js threw on its GSUB table ("lookupType:
 * 5 - substFormat: 3 is not yet supported"). Here the bundled font covers Arabic and the PNG is
 * rendered up front. If that throws we render `fallback`; if that throws too we serve the static
 * PNG bytes.
 */
export async function renderOgImage(
  element: ReactElement,
  fallback: ReactElement,
  opts: { cacheControl?: string } = {},
): Promise<Response> {
  try {
    return png(await renderPng(element), opts.cacheControl ?? OG_CACHE_DEFAULT);
  } catch (err) {
    console.error('[og] render failed, serving the fallback image:', err);
  }
  try {
    return png(await renderPng(fallback), OG_CACHE_DEFAULT);
  } catch (err) {
    console.error('[og] fallback render failed, serving the static image:', err);
  }
  return png(ogStaticFallbackPng(), OG_CACHE_DEFAULT);
}
