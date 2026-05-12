/**
 * Generate a URL-safe slug from a name string.
 * Strips diacritics, lowercases, replaces non-alphanumeric with dashes.
 */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics
    .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+/g, '') // strip Arabic script
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric runs with dash
    .replace(/^-+|-+$/g, '') // trim leading/trailing dashes
    .replace(/-{2,}/g, '-'); // collapse consecutive dashes
}
