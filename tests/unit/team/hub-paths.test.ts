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
import { bareCollisionKey, bareTeamSlug, publicTeamSlug } from '@/lib/team/public-slug';

describe('team hub paths', () => {
  it('builds localised en/fr club and national-team paths with bare slugs', () => {
    expect(hubPath('en', 'club', 'arsenal', 'squad')).toBe('/en/club/arsenal/squad');
    expect(hubPath('en', 'national', 'morocco', 'matches')).toBe(
      '/en/national-team/morocco/matches',
    );
    expect(hubPath('fr', 'national', 'maroc', 'stats')).toBe(
      '/fr/selection/maroc/statistiques-joueurs',
    );
    expect(hubPath('fr', 'club', 'arsenal')).toBe('/fr/club/arsenal');
  });

  it('parses every path it builds, in en and fr', () => {
    for (const locale of ['en', 'fr'] as const)
      for (const kind of ['club', 'national'] as const)
        for (const tab of ['overview', ...Object.keys(TAB_SEGMENTS.en)] as const) {
          const p = hubPath(locale, kind, 'arsenal', tab as never);
          expect(parseHubPath(p)).toEqual({ locale, kind, slug: 'arsenal', tab });
        }
  });

  it("does not accept another locale's segments, Arabic new routes, or foreign tabs", () => {
    expect(parseHubPath('/en/selection/x-1')).toBeNull();
    expect(tabOfSegment('en', 'effectif')).toBeNull();
    expect(parseHubPath('/en/club/x-1/effectif')?.tab).toBeNull();
    expect(parseHubPath('/ar/club/arsenal/squad')).toBeNull();
    expect(parseHubPath('/ar/equipe/arsenal-42')).toBeNull();
    expect(parseEntityPath('/ar/club/arsenal')).toBeNull();
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
    expect(parseEntityPath('/en/club/arsenal/squad')).toEqual({
      locale: 'en',
      kind: 'team',
      slug: 'arsenal',
    });
    expect(parseEntityPath('/en/equipe/arsenal-42')).toEqual({
      locale: 'en',
      kind: 'team',
      slug: 'arsenal-42',
    });
    expect(parseEntityPath('/ar/equipe/morocco-31')).toEqual({
      locale: 'ar',
      kind: 'team',
      slug: 'morocco-31',
    });
  });
});

describe('public team slugs', () => {
  it('strips the trailing id to a bare name', () => {
    expect(bareTeamSlug('arsenal-42')).toBe('arsenal');
    expect(bareTeamSlug('france-u21-21')).toBe('france-u21');
    expect(bareTeamSlug('france-w-10')).toBe('france-w');
    expect(bareTeamSlug('already-bare')).toBe('already-bare');
  });

  it('keeps the stored id-slug only when that bare name collides in the same kind', () => {
    const colliding = new Set([bareCollisionKey('sporting', false)]);
    expect(publicTeamSlug('arsenal-42', false, colliding)).toBe('arsenal');
    expect(publicTeamSlug('sporting-123', false, colliding)).toBe('sporting-123');
    expect(publicTeamSlug('sporting-9', true, colliding)).toBe('sporting');
  });
});
