/**
 * Logo availability for teams and competitions.
 *
 * `ok` — a real crest/badge we can render.
 * `missing` — no URL, empty URL, or a non-200 / empty body.
 * `placeholder` — bytes match a known API-Sports "image not available" file.
 *
 * Known hashes start with the team-crest camera graphic (Amal Tiznit 18753)
 * and the grey "OFFICIAL LOGO SOON" disc (Widad Témara 3458, USM Oujda 17716).
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

/**
 * Content hashes that must never be shown as a real crest. The scan script
 * may print newly discovered hashes; add them here after review.
 */
export const KNOWN_PLACEHOLDER_SHA256: ReadonlySet<string> = new Set([
  TEAM_PLACEHOLDER_SHA256,
  TEAM_LOGO_SOON_SHA256,
]);

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
