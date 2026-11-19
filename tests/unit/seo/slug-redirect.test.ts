import { describe, expect, it } from 'vitest';
import { parseSlugRedirect, slugRedirectPath } from '@/lib/seo/slug-redirect';

describe('slug redirects', () => {
  it('301s a renamed team slug and leaves the current slug alone', () => {
    const oldSlug = parseSlugRedirect('/en/equipe/czech-republic-770');
    expect(oldSlug).toMatchObject({ kind: 'team', id: 770, requestedSlug: 'czech-republic-770' });
    expect(slugRedirectPath(oldSlug!, 'czechia-770')).toBe('/en/equipe/czechia-770');

    const current = parseSlugRedirect('/fr/equipe/czechia-770');
    expect(slugRedirectPath(current!, 'czechia-770')).toBeNull();
  });

  it('301s a renamed player slug', () => {
    const ref = parseSlugRedirect('/ar/joueur/old-name-42');
    expect(slugRedirectPath(ref!, 'new-name-42')).toBe('/ar/joueur/new-name-42');
  });

  it('does not invent a target when the id is unknown or absent', () => {
    const ref = parseSlugRedirect('/en/equipe/czech-republic-770');
    expect(slugRedirectPath(ref!, null)).toBeNull();
    expect(parseSlugRedirect('/en/equipe/no-id')).toBeNull();
    expect(parseSlugRedirect('/en/match/czech-republic-770')).toBeNull();
  });
});
