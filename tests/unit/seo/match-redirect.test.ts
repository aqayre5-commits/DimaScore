import { describe, expect, it, vi } from 'vitest';
import {
  createCachedSlugLookup,
  parseBareMatchPath,
  resolveBareMatchRedirect,
} from '@/lib/seo/match-redirect';

describe('parseBareMatchPath', () => {
  it('matches bare numeric match URLs with or without locale', () => {
    expect(parseBareMatchPath('/en/match/898057')).toEqual({ locale: 'en', fixtureId: 898057 });
    expect(parseBareMatchPath('/ar/match/898057/')).toEqual({ locale: 'ar', fixtureId: 898057 });
    expect(parseBareMatchPath('/match/1610877')).toEqual({ locale: 'fr', fixtureId: 1610877 });
  });

  it('ignores slug URLs, API routes, other locales and absurd ids', () => {
    for (const p of [
      '/fr/match/canada-chile-1610877',
      '/api/v1/match/123',
      '/de/match/123',
      '/fr/match/0',
      '/fr/match/99999999999',
      '/fr/equipe/123',
    ]) {
      expect(parseBareMatchPath(p)).toBeNull();
    }
  });
});

describe('resolveBareMatchRedirect', () => {
  it('targets the canonical slug URL in the same locale', async () => {
    const lookup = vi.fn(async () => 'senegal-w-tunisia-women-898057');
    expect(await resolveBareMatchRedirect('/en/match/898057', lookup)).toBe(
      '/en/match/senegal-w-tunisia-women-898057',
    );
    expect(await resolveBareMatchRedirect('/match/898057', lookup)).toBe(
      '/fr/match/senegal-w-tunisia-women-898057',
    );
  });

  it('falls through for unknown ids, bare-id canonicals and DB errors', async () => {
    expect(await resolveBareMatchRedirect('/en/match/1', async () => null)).toBeNull();
    expect(await resolveBareMatchRedirect('/en/match/42', async () => '42')).toBeNull();
    expect(
      await resolveBareMatchRedirect('/en/match/42', async () => {
        throw new Error('db down');
      }),
    ).toBeNull();
  });

  it('never looks up non-matching paths', async () => {
    const lookup = vi.fn(async () => 'x-y-1');
    expect(await resolveBareMatchRedirect('/fr/match/x-y-1', lookup)).toBeNull();
    expect(lookup).not.toHaveBeenCalled();
  });
});

describe('createCachedSlugLookup', () => {
  it('caches hits and expires misses sooner', async () => {
    let t = 0;
    const inner = vi.fn(async (id: number) => (id === 1 ? 'a-b-1' : null));
    const cached = createCachedSlugLookup(inner, () => t);
    await cached(1);
    await cached(1);
    await cached(2);
    await cached(2);
    expect(inner).toHaveBeenCalledTimes(2);
    t += 6 * 60 * 1000; // past the 5-min negative TTL, inside the 1h positive TTL
    await cached(1);
    await cached(2);
    expect(inner).toHaveBeenCalledTimes(3);
  });
});
