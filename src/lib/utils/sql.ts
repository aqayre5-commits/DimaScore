/**
 * Escape special characters in a string before use in SQL LIKE/ILIKE patterns.
 * Prevents wildcard injection via user-supplied `%`, `_`, and `\`.
 */
export function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}
