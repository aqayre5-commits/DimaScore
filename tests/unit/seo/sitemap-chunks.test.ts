import { describe, expect, it } from 'vitest';
import {
  CHUNK_SIZE,
  monthRange,
  parseChunkId,
  planChunks,
  renderSitemapIndex,
} from '@/lib/seo/sitemap/chunks';

describe('planChunks', () => {
  it('splits every group into files of at most CHUNK_SIZE (well under Google 50k)', () => {
    expect(CHUNK_SIZE).toBeLessThanOrEqual(10_000);
    const chunks = planChunks({
      teams: 1_553,
      players: 42_930,
      matchesByMonth: [
        { month: '2026-10', count: 900 },
        { month: '2026-11', count: 12_001 },
        { month: '2025-01', count: 0 },
      ],
    });
    expect(chunks.map((c) => c.id)).toEqual([
      'static',
      'teams',
      'players',
      'players-1',
      'players-2',
      'players-3',
      'players-4',
      'matches-2026-11',
      'matches-2026-11-1',
      'matches-2026-10',
    ]);
  });

  it('always has the static chunk even when the DB is empty', () => {
    expect(planChunks({ teams: 0, players: 0, matchesByMonth: [] }).map((c) => c.id)).toEqual([
      'static',
    ]);
  });

  it('ignores malformed month keys', () => {
    const ids = planChunks({ teams: 0, players: 0, matchesByMonth: [{ month: 'x', count: 5 }] });
    expect(ids).toHaveLength(1);
  });
});

describe('parseChunkId', () => {
  it('round-trips planned ids', () => {
    const chunks = planChunks({
      teams: 25_000,
      players: 10_001,
      matchesByMonth: [{ month: '2026-03', count: 20_001 }],
    });
    for (const c of chunks) expect(parseChunkId(c.id)).toEqual(c);
  });

  it('rejects junk', () => {
    for (const id of ['', 'players-0', 'matches-2026-13', 'matches-2026-1', 'teams-x', '../x']) {
      expect(parseChunkId(id)).toBeNull();
    }
  });
});

describe('monthRange', () => {
  it('handles December → January', () => {
    const { start, end } = monthRange('2026-12');
    expect(start.toISOString()).toBe('2026-12-01T00:00:00.000Z');
    expect(end.toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });
});

describe('renderSitemapIndex', () => {
  it('renders a valid sitemapindex with lastmod only when known', () => {
    const xml = renderSitemapIndex('https://dimascore.ma', [
      { id: 'static', lastModified: new Date('2026-11-09T10:00:00Z') },
      { id: 'players-1' },
    ]);
    expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain(
      '<sitemap><loc>https://dimascore.ma/sitemaps/sitemap/static.xml</loc><lastmod>2026-11-09T10:00:00.000Z</lastmod></sitemap>',
    );
    expect(xml).toContain(
      '<sitemap><loc>https://dimascore.ma/sitemaps/sitemap/players-1.xml</loc></sitemap>',
    );
  });
});
