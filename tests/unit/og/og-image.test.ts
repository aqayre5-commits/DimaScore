import { createElement } from 'react';
import { writeFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ogRuns, OgText } from '@/lib/og/og-text';
import { ogFixtureId } from '@/lib/og/og-ids';

// OG images: Arabic must render with the bundled font (no request-time font download: Noto Sans
// Arabic from Google Fonts made opentype.js throw "lookupType: 5 - substFormat: 3 is not yet
// supported", the /ar competition image's Cloudflare error 1101), in right-to-left word order.

describe('ogRuns (RTL layout for Satori)', () => {
  it('keeps LTR locales as one run', () => {
    expect(ogRuns('Champions League — League Stage - 1', 'en')).toEqual([
      { dir: 'ltr', text: 'Champions League — League Stage - 1' },
    ]);
  });

  it('splits Arabic into words in logical order (laid out row-reverse)', () => {
    expect(ogRuns('دوري أبطال أوروبا', 'ar').map((r) => r.text)).toEqual([
      'دوري',
      'أبطال',
      'أوروبا',
    ]);
  });

  it('keeps a score and Latin names together, left to right', () => {
    const runs = ogRuns('المغرب 2 - 1 إسبانيا', 'ar');
    expect(runs).toEqual([
      { dir: 'rtl', text: 'المغرب' },
      { dir: 'ltr', text: '2 - 1' },
      { dir: 'rtl', text: 'إسبانيا' },
    ]);
    expect(ogRuns('هدف A. Sabiri', 'ar')[1]).toEqual({ dir: 'ltr', text: 'A. Sabiri' });
  });

  it('a dash between Arabic words follows the Arabic order', () => {
    expect(ogRuns('كأس العالم — دور الـ16', 'ar').map((r) => r.dir)).toEqual([
      'rtl',
      'rtl',
      'rtl',
      'rtl',
      'rtl',
    ]);
  });

  it('puts the digits of a mixed Arabic word on its left', () => {
    expect(ogRuns('دور الـ16', 'ar').map((r) => r.text)).toEqual(['دور', '16الـ']);
  });

  it('mirrors punctuation around an Arabic word', () => {
    // Drawn left to right: the opening bracket ends up on the right edge as ")" (bidi mirroring).
    expect(ogRuns('(ركلات الترجيح)', 'ar').map((r) => r.text)).toEqual(['ركلات)', '(الترجيح']);
  });
});

describe('ogFixtureId', () => {
  it('reads the slug+id the canonical match URL uses, and the bare id', () => {
    expect(ogFixtureId('morocco-spain-977345')).toBe(977345);
    expect(ogFixtureId('977345')).toBe(977345);
    expect(ogFixtureId('manchester-city-fulham-1379071')).toBe(1379071);
  });
  it('rejects junk', () => {
    expect(ogFixtureId('morocco-spain')).toBeNull();
    expect(ogFixtureId('%E0%A4%A')).toBeNull();
    expect(ogFixtureId('0')).toBeNull();
  });
});

describe('renderOgImage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders Arabic text to a PNG without downloading a font', async () => {
    // Satori loads its own wasm from data: URLs; any http(s) request would be a font download.
    const realFetch = globalThis.fetch;
    const network: string[] = [];
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.startsWith('data:')) return realFetch(input, init);
      network.push(url);
      return Promise.reject(new Error('no network in OG rendering'));
    });
    const { renderOgImage, OG_FONT_FAMILY } = await import('@/lib/og/og-image');
    const el = createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d1117',
          color: '#e6edf3',
          fontFamily: OG_FONT_FAMILY,
        },
      },
      createElement(OgText, { text: 'دوري أبطال أوروبا', locale: 'ar', style: { fontSize: 64 } }),
      createElement(OgText, {
        text: 'مانشستر سيتي 0 - 1 فولهام · الأهلي',
        locale: 'ar',
        style: { fontSize: 40 },
      }),
      createElement(OgText, {
        text: 'Saïss · Ziyech · Tirs au but',
        locale: 'fr',
        style: { fontSize: 40 },
      }),
    );
    const res = await renderOgImage(el, el);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate');
    const png = Buffer.from(await res.arrayBuffer());
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.length).toBeGreaterThan(5_000);
    expect(network).toEqual([]);
    if (process.env.OG_TEST_OUT) writeFileSync(process.env.OG_TEST_OUT, png);
  });
});

describe('renderOgImage: cache headers and failure paths (never a 500)', () => {
  const ok = () =>
    createElement(
      'div',
      { style: { display: 'flex', width: '100%', height: '100%', background: '#0d1117' } },
      'ok',
    );
  function Boom(): never {
    throw new Error('boom');
  }
  const broken = () => createElement('div', { style: { display: 'flex' } }, createElement(Boom));

  async function expectPng(res: Response) {
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    const png = Buffer.from(await res.arrayBuffer());
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    // IHDR: 1200x630, as the routes declare.
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    return png;
  }

  it('uses the longer CDN cache for a finished match', async () => {
    const { renderOgImage, OG_CACHE_FINISHED } = await import('@/lib/og/og-image');
    const res = await renderOgImage(ok(), ok(), { cacheControl: OG_CACHE_FINISHED });
    await expectPng(res);
    expect(res.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
    );
  });

  it('serves the fallback image (200, short cache) when the main render throws', async () => {
    const { renderOgImage, OG_CACHE_FINISHED } = await import('@/lib/og/og-image');
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await renderOgImage(broken(), ok(), { cacheControl: OG_CACHE_FINISHED });
    await expectPng(res);
    expect(res.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate');
    expect(err).toHaveBeenCalledTimes(1);
    err.mockRestore();
  });

  it('serves the static PNG (200) when the fallback render throws too', async () => {
    const { renderOgImage, ogStaticFallbackPng } = await import('@/lib/og/og-image');
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await renderOgImage(broken(), broken());
    const png = await expectPng(res);
    expect(png.equals(Buffer.from(ogStaticFallbackPng()))).toBe(true);
    expect(res.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate');
    expect(err).toHaveBeenCalledTimes(2);
    err.mockRestore();
  });

  it('serves the static PNG when the renderer itself fails (e.g. a font error)', async () => {
    vi.resetModules();
    vi.doMock('next/og', () => ({
      ImageResponse: class {
        arrayBuffer() {
          return Promise.reject(new Error('lookupType: 5 - substFormat: 3 is not yet supported'));
        }
      },
    }));
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { renderOgImage } = await import('@/lib/og/og-image');
    await expectPng(await renderOgImage(ok(), ok()));
    err.mockRestore();
    vi.doUnmock('next/og');
    vi.resetModules();
  });
});
