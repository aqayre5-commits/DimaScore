import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  NOT_FOUND_COPY,
  createExistenceCache,
  entityHttpResponse,
  entityLookupKey,
  parseEntityPath,
  type EntityRef,
} from '@/lib/seo/entity-http';

const ref = (over: Partial<EntityRef> & Pick<EntityRef, 'kind' | 'slug'>): EntityRef => ({
  locale: 'fr',
  ...over,
});

describe('parseEntityPath', () => {
  it('reads locale, kind and slug, including a locale-less match url', () => {
    expect(parseEntityPath('/en/match/netherlands-germany-1528862')).toEqual({
      locale: 'en',
      kind: 'match',
      slug: 'netherlands-germany-1528862',
    });
    expect(parseEntityPath('/ar/equipe/raja-ca-31/')).toEqual({
      locale: 'ar',
      kind: 'team',
      slug: 'raja-ca-31',
    });
    expect(parseEntityPath('/fr/joueur/achraf-hakimi-2780')).toEqual({
      locale: 'fr',
      kind: 'player',
      slug: 'achraf-hakimi-2780',
    });
    expect(parseEntityPath('/match/1528862')).toEqual({
      locale: 'fr',
      kind: 'match',
      slug: '1528862',
    });
  });

  it('decodes the slug and ignores everything that is not an entity url', () => {
    expect(parseEntityPath('/fr/equipe/wydad-ac-1033')).toMatchObject({ slug: 'wydad-ac-1033' });
    expect(parseEntityPath('/fr/equipe/' + encodeURIComponent('رجاء-31'))).toMatchObject({
      slug: 'رجاء-31',
    });
    for (const path of [
      '/fr',
      '/fr/competition/maroc/botola-pro',
      '/en/about',
      '/api/v1/match/1',
    ]) {
      expect(parseEntityPath(path)).toBeNull();
    }
  });
});

describe('entityLookupKey', () => {
  it('resolves a trailing id and refuses ids that cannot exist', () => {
    expect(entityLookupKey(ref({ kind: 'match', slug: 'netherlands-germany-1528862' }))).toEqual({
      by: 'id',
      id: 1528862,
    });
    expect(entityLookupKey(ref({ kind: 'team', slug: 'not-a-real-team-999999999' }))).toEqual({
      by: 'id',
      id: 999999999,
    });
    expect(entityLookupKey(ref({ kind: 'match', slug: 'no-id-here' }))).toEqual({
      by: 'impossible',
    });
    expect(entityLookupKey(ref({ kind: 'player', slug: 'nobody-9999999999' }))).toEqual({
      by: 'impossible',
    });
  });

  it('keeps an id-less team or player slug as an exact lookup, same as the page', () => {
    expect(entityLookupKey(ref({ kind: 'team', slug: 'morocco' }))).toEqual({ by: 'slug' });
    expect(entityLookupKey(ref({ kind: 'player', slug: 'hakimi' }))).toEqual({ by: 'slug' });
  });
});

describe('entityHttpResponse', () => {
  it('lets a real id through, whatever its status (finished or upcoming)', () => {
    const entity = ref({ locale: 'en', kind: 'match', slug: 'netherlands-germany-1528862' });
    expect(entityHttpResponse(entity, 'found')).toBeNull();
  });

  it('returns a localized noindex 404 for an unknown id', () => {
    const res = entityHttpResponse(
      ref({ locale: 'ar', kind: 'player', slug: 'nobody-player-999999999' }),
      'missing',
    );
    expect(res?.status).toBe(404);
    expect(res?.headers['x-robots-tag']).toBe('noindex, nofollow');
    expect(res?.headers['cache-control']).toContain('no-store');
    expect(res?.body).toContain('<html lang="ar" dir="rtl">');
    expect(res?.body).toContain('name="robots" content="noindex, nofollow"');
    expect(res?.body).toContain(NOT_FOUND_COPY.ar.heading);
    expect(res?.body).toContain('href="/ar"');
    expect(res?.body).not.toContain(NOT_FOUND_COPY.fr.heading);
  });

  it('uses the French page when the url has no locale', () => {
    const res = entityHttpResponse(ref({ kind: 'match', slug: '999999999' }), 'missing');
    expect(res?.status).toBe(404);
    expect(res?.body).toContain('<html lang="fr" dir="ltr">');
    expect(res?.body).toContain(NOT_FOUND_COPY.fr.heading);
  });

  it('answers 503, not 404, when the data source is down', () => {
    const res = entityHttpResponse(
      ref({ locale: 'en', kind: 'team', slug: 'raja-ca-31' }),
      'unavailable',
    );
    expect(res?.status).toBe(503);
    expect(res?.headers['retry-after']).toBe('120');
    expect(res?.headers['x-robots-tag']).toContain('noindex');
    expect(res?.body).toContain('<html lang="en" dir="ltr">');
    expect(res?.body).toContain('Temporarily unavailable');
    expect(res?.body).not.toContain(NOT_FOUND_COPY.en.heading);
  });

  it('stays in sync with the translated not-found copy', () => {
    for (const locale of ['fr', 'en', 'ar'] as const) {
      const messages = JSON.parse(readFileSync(`src/lib/i18n/messages/${locale}.json`, 'utf8')) as {
        notFound: { heading: string; body: string; cta: string };
      };
      expect(NOT_FOUND_COPY[locale]).toEqual(messages.notFound);
    }
  });
});

describe('createExistenceCache', () => {
  it('does not turn a database error into a miss, and reuses a known hit', async () => {
    let now = 1_000;
    const resolve = createExistenceCache(() => now);
    expect(await resolve('match:1', async () => 'found')).toBe('found');

    now += 10_000;
    expect(
      await resolve('match:1', async () => {
        throw new Error('db down');
      }),
    ).toBe('found');

    // Past the found TTL: a later outage still must not flip a known page to missing/404.
    now += 6 * 60 * 1000;
    expect(
      await resolve('match:1', async () => {
        throw new Error('db down');
      }),
    ).toBe('found');

    await expect(
      resolve('match:2', async () => {
        throw new Error('db down');
      }),
    ).resolves.toBe('unavailable');

    expect(await resolve('team:9', async () => 'missing')).toBe('missing');
    now += 30_000;
    let calls = 0;
    expect(
      await resolve('team:9', async () => {
        calls += 1;
        return 'found';
      }),
    ).toBe('missing');
    expect(calls).toBe(0);
  });
});
