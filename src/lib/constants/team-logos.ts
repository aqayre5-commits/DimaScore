import { usableLogoUrl, type LogoStatus } from '@/lib/logos/status';

/**
 * Team crest overrides shipped under /public/logos/teams.
 * World Cup 2026 senior national teams, Abdilahi's Morocco crest for every
 * Morocco national side, and unambiguous football-logos.cc matches for sides
 * that otherwise fall back to the shield. The database is
 * not written; queries and Flag/TeamMark prefer these paths at render time.
 */
export type TeamLogoKind = 'wc-senior' | 'fallback' | 'morocco';

export type TeamLogoOverride = {
  src: string;
  compact?: string;
  kind: TeamLogoKind;
};

export const TEAM_LOGO_OVERRIDES: Record<number, TeamLogoOverride> = {
  1: { src: '/logos/teams/1.svg', kind: 'wc-senior' },
  2: { src: '/logos/teams/2.svg', kind: 'wc-senior' },
  3: { src: '/logos/teams/3.svg', kind: 'wc-senior', compact: '/logos/teams/3-64.webp' },
  5: { src: '/logos/teams/5.svg', kind: 'wc-senior' },
  6: { src: '/logos/teams/6.svg', kind: 'wc-senior' },
  7: { src: '/logos/teams/7.svg', kind: 'wc-senior' },
  8: { src: '/logos/teams/8.svg', kind: 'wc-senior', compact: '/logos/teams/8-64.webp' },
  9: { src: '/logos/teams/9.svg', kind: 'wc-senior', compact: '/logos/teams/9-64.webp' },
  10: { src: '/logos/teams/10.svg', kind: 'wc-senior', compact: '/logos/teams/10-64.webp' },
  11: { src: '/logos/teams/11.svg', kind: 'wc-senior', compact: '/logos/teams/11-64.webp' },
  12: { src: '/logos/teams/12.svg', kind: 'wc-senior' },
  13: { src: '/logos/teams/13.svg', kind: 'wc-senior' },
  15: { src: '/logos/teams/15.svg', kind: 'wc-senior' },
  16: { src: '/logos/teams/16.svg', kind: 'wc-senior' },
  17: { src: '/logos/teams/17.svg', kind: 'wc-senior' },
  20: { src: '/logos/teams/20.svg', kind: 'wc-senior', compact: '/logos/teams/20-64.webp' },
  22: { src: '/logos/teams/22.svg', kind: 'wc-senior', compact: '/logos/teams/22-64.webp' },
  23: { src: '/logos/teams/23.svg', kind: 'wc-senior' },
  25: { src: '/logos/teams/25.svg', kind: 'wc-senior' },
  26: { src: '/logos/teams/26.svg', kind: 'wc-senior' },
  27: { src: '/logos/teams/27.svg', kind: 'wc-senior' },
  28: { src: '/logos/teams/28.svg', kind: 'wc-senior' },
  31: { src: '/logos/teams/morocco.svg', kind: 'morocco', compact: '/logos/teams/morocco-64.webp' },
  32: { src: '/logos/teams/32.svg', kind: 'wc-senior' },
  770: { src: '/logos/teams/770.svg', kind: 'wc-senior' },
  775: { src: '/logos/teams/775.svg', kind: 'wc-senior' },
  777: { src: '/logos/teams/777.svg', kind: 'wc-senior' },
  1090: { src: '/logos/teams/1090.svg', kind: 'wc-senior', compact: '/logos/teams/1090-64.webp' },
  1108: { src: '/logos/teams/1108.svg', kind: 'wc-senior', compact: '/logos/teams/1108-64.webp' },
  1113: { src: '/logos/teams/1113.svg', kind: 'wc-senior', compact: '/logos/teams/1113-64.webp' },
  1118: { src: '/logos/teams/1118.svg', kind: 'wc-senior', compact: '/logos/teams/1118-64.webp' },
  1501: { src: '/logos/teams/1501.svg', kind: 'wc-senior' },
  1504: { src: '/logos/teams/1504.svg', kind: 'wc-senior', compact: '/logos/teams/1504-64.webp' },
  1508: { src: '/logos/teams/1508.svg', kind: 'wc-senior', compact: '/logos/teams/1508-64.webp' },
  1531: { src: '/logos/teams/1531.svg', kind: 'wc-senior' },
  1532: { src: '/logos/teams/1532.svg', kind: 'wc-senior' },
  1533: { src: '/logos/teams/1533.svg', kind: 'wc-senior' },
  1548: { src: '/logos/teams/1548.svg', kind: 'wc-senior' },
  1567: { src: '/logos/teams/1567.svg', kind: 'wc-senior', compact: '/logos/teams/1567-64.webp' },
  1568: { src: '/logos/teams/1568.svg', kind: 'wc-senior' },
  1569: { src: '/logos/teams/1569.svg', kind: 'wc-senior', compact: '/logos/teams/1569-64.webp' },
  2380: { src: '/logos/teams/2380.svg', kind: 'wc-senior' },
  2382: { src: '/logos/teams/2382.svg', kind: 'wc-senior' },
  2384: { src: '/logos/teams/2384.svg', kind: 'wc-senior' },
  2386: { src: '/logos/teams/2386.svg', kind: 'wc-senior', compact: '/logos/teams/2386-64.webp' },
  3458: { src: '/logos/teams/3458.svg', kind: 'fallback' },
  4673: { src: '/logos/teams/4673.svg', kind: 'wc-senior' },
  5529: { src: '/logos/teams/5529.svg', kind: 'wc-senior' },
  5530: { src: '/logos/teams/5530.svg', kind: 'wc-senior' },
  10179: {
    src: '/logos/teams/morocco.svg',
    kind: 'morocco',
    compact: '/logos/teams/morocco-64.webp',
  },
  11039: {
    src: '/logos/teams/morocco.svg',
    kind: 'morocco',
    compact: '/logos/teams/morocco-64.webp',
  },
  12427: { src: '/logos/teams/12427.svg', kind: 'fallback', compact: '/logos/teams/12427-64.webp' },
  14461: {
    src: '/logos/teams/morocco.svg',
    kind: 'morocco',
    compact: '/logos/teams/morocco-64.webp',
  },
  15562: { src: '/logos/teams/15562.svg', kind: 'fallback', compact: '/logos/teams/15562-64.webp' },
  18753: { src: '/logos/teams/18753.svg', kind: 'fallback', compact: '/logos/teams/18753-64.webp' },
  19072: {
    src: '/logos/teams/morocco.svg',
    kind: 'morocco',
    compact: '/logos/teams/morocco-64.webp',
  },
  20529: {
    src: '/logos/teams/morocco.svg',
    kind: 'morocco',
    compact: '/logos/teams/morocco-64.webp',
  },
  21302: {
    src: '/logos/teams/morocco.svg',
    kind: 'morocco',
    compact: '/logos/teams/morocco-64.webp',
  },
};

/** Same-origin curated crest/competition artwork under /public. */
export function isCuratedLogoSrc(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith('/logos/') || url.startsWith('/competitions/');
}

/** The custom crest for a team if one exists, otherwise the provided DB logo url. */
export function resolveTeamLogo(
  teamId: number | null | undefined,
  dbLogoUrl: string | null,
  logoStatus?: LogoStatus | null,
): string | null {
  if (teamId != null && TEAM_LOGO_OVERRIDES[teamId]) {
    return TEAM_LOGO_OVERRIDES[teamId].src;
  }
  return usableLogoUrl(dbLogoUrl, logoStatus);
}

/**
 * Prefer the compact ticker/rail raster when the render size is at most 32 CSS px
 * and a compact asset was generated for a large or raster-embedded SVG.
 */
export function compactTeamLogoSrc(src: string | null | undefined, size?: number): string | null {
  if (!src) return null;
  if (size != null && size <= 32) {
    const hit = Object.values(TEAM_LOGO_OVERRIDES).find((o) => o.src === src);
    if (hit?.compact) return hit.compact;
  }
  return src;
}
