import { parseTrailingId } from '@/lib/seo/entity-slug';

/** Accepts the canonical slug+id ("morocco-spain-977345") and the legacy bare id, like the page. */
export function ogFixtureId(raw: string): number | null {
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // keep the raw segment
  }
  const id = parseTrailingId(decoded);
  return id != null && id > 0 && id < 2_000_000_000 ? id : null;
}
