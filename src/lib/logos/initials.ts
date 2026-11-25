/**
 * 2–3 letter mark for a fallback crest.
 *
 * Preference (and what we chose for Arabic names):
 *  1. `teams.code` when it is 2–3 letters/digits (Latin short code).
 *  2. A Latin `shortName` of 2–3 letters, or initials from a Latin short name.
 *  3. Initials / first 3 letters from a Latin `name` (`en`, then `fr`, then any Latin script).
 *  4. Otherwise Arabic (or other non-Latin) initials from the display name.
 *
 * Never invent a FIFA-style code that is not already stored.
 */

export type InitialsSource = 'code' | 'short-latin' | 'name-latin' | 'arabic-initials' | 'fallback';

export type InitialsInput = {
  code?: string | null;
  name?: string | Record<string, string> | null;
  shortName?: string | Record<string, string> | null;
  locale?: string | null;
};

const SKIP = new Set([
  'fc',
  'cf',
  'sc',
  'ac',
  'as',
  'afc',
  'cfc',
  'rfc',
  'ssc',
  'ud',
  'cd',
  'rcd',
  'united',
  'town',
  'city',
  'the',
  'de',
  'di',
  'da',
  'do',
  'del',
  'della',
  'van',
  'von',
  'la',
  'le',
  'el',
  'al',
  'and',
  'of',
  'women',
  'woman',
  'ladies',
  'w',
  'f',
  'reserve',
  'reserves',
  'u21',
  'u23',
  'u20',
  'u19',
  'u18',
  'u17',
  'ii',
  'iii',
]);

const ARABIC_SKIP = new Set(['ال', 'و', 'في', 'للسيدات', 'سيدات']);

function isLatinText(s: string): boolean {
  return /[A-Za-z]/.test(s) && !/\p{Script=Arabic}/u.test(s);
}

function compactCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.normalize('NFKD').replace(/[^\p{L}\p{N}]/gu, '');
  if (t.length >= 2 && t.length <= 3 && isLatinText(t)) return t.toUpperCase();
  return null;
}

function words(s: string): string[] {
  return s
    .replace(/[-_/]+/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

function significantLatinWords(s: string): string[] {
  return words(s).filter((w) => {
    const key = w
      .normalize('NFKD')
      .replace(/[^\p{L}\p{N}]/gu, '')
      .toLowerCase();
    return key.length > 0 && !SKIP.has(key);
  });
}

function latinInitialsFrom(s: string): string | null {
  const sig = significantLatinWords(s);
  if (sig.length >= 2) {
    return sig
      .slice(0, 3)
      .map((w) => w[0]!)
      .join('')
      .toUpperCase();
  }
  const one = (sig[0] ?? words(s)[0] ?? '').normalize('NFKD').replace(/[^\p{L}\p{N}]/gu, '');
  if (one.length >= 2) return one.slice(0, 3).toUpperCase();
  return compactCode(s);
}

function arabicInitialsFrom(s: string): string | null {
  const sig = words(s).filter(
    (w) => !ARABIC_SKIP.has(w.replace(/^ال/, '')) && !SKIP.has(w.toLowerCase()),
  );
  const src = sig.length ? sig : words(s);
  if (src.length >= 2) {
    return src
      .slice(0, 3)
      .map((w) => w.replace(/^ال/, '')[0] ?? w[0]!)
      .join('');
  }
  if (src[0] && src[0].length >= 2) return src[0].replace(/^ال/, '').slice(0, 3);
  return src[0]?.[0] ?? null;
}

function pickString(
  value: string | Record<string, string> | null | undefined,
  locale: string | null | undefined,
  preferLatin: boolean,
): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value.trim() || null;
  const order = [preferLatin ? 'en' : locale, 'en', 'fr', locale, ...Object.keys(value)].filter(
    Boolean,
  ) as string[];
  const seen = new Set<string>();
  for (const k of order) {
    if (seen.has(k)) continue;
    seen.add(k);
    const v = value[k]?.trim();
    if (!v) continue;
    if (preferLatin && !isLatinText(v)) continue;
    return v;
  }
  if (!preferLatin) {
    for (const v of Object.values(value)) {
      if (v?.trim()) return v.trim();
    }
  }
  return null;
}

export function logoInitials(input: InitialsInput): { initials: string; source: InitialsSource } {
  const locale = input.locale ?? 'en';

  const fromCode = compactCode(input.code ?? null);
  if (fromCode) return { initials: fromCode, source: 'code' };

  const shortLatin = pickString(input.shortName, locale, true);
  if (shortLatin) {
    const asCode = compactCode(shortLatin);
    if (asCode) return { initials: asCode, source: 'short-latin' };
    const ini = latinInitialsFrom(shortLatin);
    if (ini) return { initials: ini, source: 'short-latin' };
  }

  const nameLatin = pickString(input.name, locale, true);
  if (nameLatin) {
    const ini = latinInitialsFrom(nameLatin);
    if (ini) return { initials: ini, source: 'name-latin' };
  }

  const display =
    pickString(input.name, locale, false) ?? pickString(input.shortName, locale, false);
  if (display) {
    const ar = arabicInitialsFrom(display);
    if (ar) return { initials: ar, source: 'arabic-initials' };
  }

  return { initials: '•', source: 'fallback' };
}
