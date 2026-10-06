/**
 * Age helpers + under-16 safeguarding (Phase 16 · Task F).
 *
 * Minors under 16 get reduced exposure: no photo (silhouette), and no physical details (height,
 * weight, shirt number) or exact date of birth. Age itself (a coarse year figure) may still show.
 * The check is render-time from birth_date, so a player crosses the threshold automatically on their
 * 16th birthday with no re-ingestion.
 */
export const UNDERAGE_THRESHOLD = 16;

/** Completed years between birthDate and `now`. Null for missing/unparseable dates. */
export function computeAge(
  birthDate: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

/** True when the player is under 16 (safeguarding). Unknown birth date → not underage (can't assert). */
export function isUnderage(birthDate: string | null | undefined, now: Date = new Date()): boolean {
  const age = computeAge(birthDate, now);
  return age != null && age < UNDERAGE_THRESHOLD;
}
