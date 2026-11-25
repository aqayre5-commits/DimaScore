import { createHash } from 'node:crypto';
import { classifyLogoBytes, type LogoClassification, usableLogoUrl } from './status';

export type ClassifyCache = Map<string, LogoClassification>;

const DEFAULT_TIMEOUT_MS = 8_000;

function sha256Hex(buf: Uint8Array): string {
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * HEAD/GET a public CDN logo URL and classify it. Polite: caller owns concurrency.
 * Results are cached by URL (including the empty-URL missing case under a sentinel).
 */
export async function classifyLogoUrl(
  url: string | null | undefined,
  opts?: { timeoutMs?: number; cache?: ClassifyCache; userAgent?: string },
): Promise<LogoClassification> {
  const trimmed = usableLogoUrl(url, null);
  const cacheKey = trimmed ?? '__empty__';
  if (opts?.cache?.has(cacheKey)) return opts.cache.get(cacheKey)!;
  if (!trimmed) {
    const empty: LogoClassification = {
      status: 'missing',
      sha256: null,
      httpStatus: null,
      bytes: null,
      contentType: null,
    };
    opts?.cache?.set(cacheKey, empty);
    return empty;
  }

  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const headers: Record<string, string> = {
    'User-Agent': opts?.userAgent ?? 'DimaScore-logo-scan/1.0 (logo status; polite; cacheable)',
    Accept: 'image/*,*/*;q=0.8',
  };

  const result = await fetchAndHash(trimmed, headers, timeoutMs);
  opts?.cache?.set(cacheKey, result);
  return result;
}

async function fetchAndHash(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<LogoClassification> {
  try {
    // Prefer GET: some CDNs omit body (and sometimes Content-Length) on HEAD,
    // and we must hash the bytes. A single GET with a timeout is enough.
    const res = await fetch(url, {
      method: 'GET',
      headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
    const type = res.headers.get('content-type');
    if (!res.ok) {
      return classifyLogoBytes(res.status, null, null);
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    const sha = buf.byteLength ? sha256Hex(buf) : null;
    const classified = classifyLogoBytes(res.status, buf, sha);
    return { ...classified, contentType: type };
  } catch {
    return {
      status: 'missing',
      sha256: null,
      httpStatus: null,
      bytes: null,
      contentType: null,
    };
  }
}
