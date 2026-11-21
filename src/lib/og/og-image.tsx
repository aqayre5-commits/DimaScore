import { ImageResponse } from 'next/og';
import type { ReactElement } from 'react';
import { OG_FONT_BASE64 } from './og-font-data';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_FONT_FAMILY = 'DimaScore OG';

let fontData: ArrayBuffer | null = null;
function ogFont(): ArrayBuffer {
  if (!fontData) {
    const bin = atob(OG_FONT_BASE64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    fontData = bytes.buffer;
  }
  return fontData;
}

/** Fonts for every OG image: the bundled Plex Sans Arabic (Arabic + Latin), so Satori never
 *  downloads a fallback font at request time (see renderOgImage). */
export function ogFonts() {
  return [{ name: OG_FONT_FAMILY, data: ogFont(), weight: 700 as const, style: 'normal' as const }];
}

/**
 * Render an OG image to a finished PNG response.
 *
 * ImageResponse renders inside its body stream, after the route handler has returned, so a render
 * error can't be caught by the route and surfaced on Cloudflare as a Worker exception (error 1101).
 * That is what the /ar competition image did: with no Arabic font supplied, @vercel/og fetched Noto
 * Sans Arabic from Google Fonts at request time, and opentype.js threw on its GSUB table ("lookupType:
 * 5 - substFormat: 3 is not yet supported"). Here the bundled font covers Arabic, and the PNG is
 * rendered up front, so if anything still throws we serve `fallback` instead.
 */
export async function renderOgImage(element: ReactElement, fallback: ReactElement) {
  const options = { ...OG_SIZE, fonts: ogFonts() };
  const headers = { 'content-type': 'image/png' };
  try {
    const png = await new ImageResponse(element, options).arrayBuffer();
    return new Response(png, { headers });
  } catch (err) {
    console.error('[og] render failed, serving the fallback image:', err);
    const png = await new ImageResponse(fallback, options).arrayBuffer();
    return new Response(png, { headers });
  }
}
