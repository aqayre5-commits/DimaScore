/**
 * Logo availability for teams and competitions.
 *
 * `ok` — a real crest/badge we can render.
 * `missing` — no URL, empty URL, or a non-200 / empty body.
 * `placeholder` — bytes match a known API-Sports "image not available" file.
 *
 * Known hashes start with the team-crest camera graphic (Amal Tiznit 18753)
 * and the grey "OFFICIAL LOGO SOON" disc (Widad Témara 3458, USM Oujda 17716),
 * plus a black-background camera and an empty outline shield found on 14
 * further production teams.
 * The scan script reports any additional repeated hashes (e.g. a different
 * competition placeholder) so they can be added here after review.
 */
export type LogoStatus = 'ok' | 'missing' | 'placeholder';

/** SHA-256 of API-Sports' generic grey camera "image not available" (29,416-byte PNG, 150×150). */
export const TEAM_PLACEHOLDER_SHA256 =
  '72f0bbb253ab54961cd5d66148e55aceb3e6bc9823da43e57a6e0812e5427430';

/** SHA-256 of API-Sports' grey "OFFICIAL LOGO SOON" disc (6,746-byte PNG, 150×150). */
export const TEAM_LOGO_SOON_SHA256 =
  '78e6132b4b2566fbab177137480d0f883aee9c2370bd9a668787263c1a2d9138';

/** SHA-256 of the same camera graphic on a black background (90,381-byte PNG). */
export const TEAM_CAMERA_DARK_SHA256 =
  '7670cc2d08b0b4a846ac6ec076c99d3767c4d2b9322e2d31cd05871422ddbbda';

/** SHA-256 of API-Sports' empty outline shield on a black background (90,381-byte PNG). */
export const TEAM_SHIELD_OUTLINE_SHA256 =
  'a2cea5dc38d2802f6f45317809cba250357b375cd3ba0373754fa9b4938f453b';

/**
 * Content hashes that must never be shown as a real crest. The scan script
 * may print newly discovered hashes; add them here after review.
 */
export const KNOWN_PLACEHOLDER_SHA256: ReadonlySet<string> = new Set([
  TEAM_PLACEHOLDER_SHA256,
  TEAM_LOGO_SOON_SHA256,
  TEAM_CAMERA_DARK_SHA256,
  TEAM_SHIELD_OUTLINE_SHA256,
]);

/** SHA-256 of API-Sports' grey player silhouette (5,192-byte 150×150 PNG). */
export const PLAYER_SILHOUETTE_SHA256 =
  '2ff7d52a628fce5d954c58480dde4e47396db4bb405b7b7d6a6567134bf86422';

/** API-Sports coach graphic: grey bust with "NO PHOTO YET" (8,624-byte 150×150 PNG). */
export const COACH_NO_PHOTO_SHA256 =
  '575e4487e3942dd820fe682e8b81f9c59b0b0d60265433ce5bd1884db4004035';

/** API-Sports coach graphic: empty outline shield on black (12,934-byte 150×150 PNG). */
export const COACH_SHIELD_OUTLINE_SHA256 =
  'b602abdd01273f6dd29855a6aed585747243148768da4a5a54e3cebd9989fd36';

export const KNOWN_PHOTO_PLACEHOLDER_SHA256: ReadonlySet<string> = new Set([
  PLAYER_SILHOUETTE_SHA256,
  COACH_NO_PHOTO_SHA256,
  COACH_SHIELD_OUTLINE_SHA256,
]);

export function isKnownPhotoPlaceholderHash(sha256: string | null | undefined): boolean {
  return !!sha256 && KNOWN_PHOTO_PLACEHOLDER_SHA256.has(sha256.toLowerCase());
}

export function isKnownPlaceholderHash(sha256: string | null | undefined): boolean {
  return !!sha256 && KNOWN_PLACEHOLDER_SHA256.has(sha256.toLowerCase());
}

export function usableLogoUrl(
  url: string | null | undefined,
  status?: LogoStatus | null,
): string | null {
  const trimmed = url?.trim() || null;
  if (!trimmed) return null;
  if (status === 'missing' || status === 'placeholder') return null;
  return trimmed;
}

export type LogoClassification = {
  status: LogoStatus;
  sha256: string | null;
  httpStatus: number | null;
  bytes: number | null;
  contentType: string | null;
};

export function classifyLogoBytes(
  httpStatus: number | null,
  body: Uint8Array | null,
  sha256: string | null,
): LogoClassification {
  const bytes = body?.byteLength ?? 0;
  if (httpStatus == null || httpStatus < 200 || httpStatus >= 300 || !body || bytes === 0) {
    return {
      status: 'missing',
      sha256: sha256 ?? null,
      httpStatus,
      bytes: bytes || null,
      contentType: null,
    };
  }
  if (isKnownPlaceholderHash(sha256)) {
    return { status: 'placeholder', sha256, httpStatus, bytes, contentType: null };
  }
  return { status: 'ok', sha256, httpStatus, bytes, contentType: null };
}
