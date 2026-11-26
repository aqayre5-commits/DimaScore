import { describe, expect, it } from 'vitest';
import {
  hubPath,
  legacyHashTab,
  parseHubPath,
  tabOfSegment,
  HUB_SEGMENTS,
  TAB_SEGMENTS,
} from '@/lib/team/hub-paths';
import { parseEntityPath } from '@/lib/seo/entity-http';

describe('team hub paths', () => {
  it('builds localised club and national-team paths', () => {
    expect(hubPath('en', 'club', 'arsenal-42', 'squad')).toBe('/en/club/arsenal-42/squad');
    expect(hubPath('en', 'national', 'morocco-31', 'matches')).toBe(
      '/en/national-team/morocco-31/matches',
    );
    expect(hubPath('fr', 'national', 'maroc-31', 'stats')).toBe(
      '/fr/selection/maroc-31/statistiques-joueurs',
    );
    expect(hubPath('fr', 'club', 'arsenal-42')).toBe('/fr/club/arsenal-42');
    expect(decodeURIComponent(hubPath('ar', 'club', 'arsenal-42', 'squad'))).toBe(
      '/ar/club/arsenal-42/التشكيلة',
    );
  });

  it('parses every path it builds, in every locale', () => {
    for (const locale of ['en', 'fr', 'ar'] as const)
      for (const kind of ['club', 'national'] as const)
        for (const tab of ['overview', ...Object.keys(TAB_SEGMENTS.en)] as const) {
          const p = hubPath(locale, kind, 'x-1', tab as never);
          expect(parseHubPath(p)).toEqual({ locale, kind, slug: 'x-1', tab });
          expect(parseHubPath(encodeURI(decodeURIComponent(p)))).toEqual({
            locale,
            kind,
            slug: 'x-1',
            tab,
          });
        }
  });

  it("does not accept another locale's segments or tabs", () => {
    expect(parseHubPath('/en/selection/x-1')).toBeNull();
    expect(tabOfSegment('en', 'effectif')).toBeNull();
    expect(parseHubPath('/en/club/x-1/effectif')?.tab).toBeNull();
    expect(HUB_SEGMENTS.fr.national).toBe('selection');
  });

  it('maps the earlier #hash links of every locale', () => {
    expect(legacyHashTab('#squad')).toBe('squad');
    expect(legacyHashTab('#effectif')).toBe('squad');
    expect(legacyHashTab(`#${encodeURIComponent('التشكيلة')}`)).toBe('squad');
    expect(legacyHashTab('#classement')).toBe('table');
    expect(legacyHashTab('#nope')).toBeNull();
  });

  it('gives the middleware existence check the team of a tab URL', () => {
    expect(parseEntityPath('/en/club/arsenal-42/squad')).toEqual({
      locale: 'en',
      kind: 'team',
      slug: 'arsenal-42',
    });
    expect(
      parseEntityPath('/ar/national-team/morocco-31/' + encodeURIComponent('المباريات')),
    ).toEqual({
      locale: 'ar',
      kind: 'team',
      slug: 'morocco-31',
    });
    expect(parseEntityPath('/en/equipe/arsenal-42')).toEqual({
      locale: 'en',
      kind: 'team',
      slug: 'arsenal-42',
    });
  });
});
