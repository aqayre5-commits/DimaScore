import { describe, expect, it } from 'vitest';
import { buildWebSite } from '@/lib/seo/jsonld';

// The header search is a modal on /api/v1/search; /{locale}/recherche is not a page. A SearchAction
// pointing at it would 404, so the sitewide WebSite node must not carry one (SEO PR #21 removed it;
// the founder work in R7 must not bring it back).
describe('sitewide WebSite node', () => {
  for (const locale of ['en', 'fr', 'ar']) {
    it(`has no potentialAction / SearchAction (${locale})`, () => {
      const node = buildWebSite('https://dimascore.ma', locale);
      expect(node).not.toHaveProperty('potentialAction');
      expect(JSON.stringify(node)).not.toContain('SearchAction');
      expect(JSON.stringify(node)).not.toContain('recherche');
      expect(node['@id']).toBe('https://dimascore.ma/#website');
    });
  }
});
