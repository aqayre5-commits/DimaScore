import type { CSSProperties } from 'react';
import { visualArabic } from './arabic-shape';

/**
 * Arabic in Open Graph images.
 *
 * Satori (next/og) shapes Arabic letters (joining forms, lam-alef) with the font's GSUB table, but
 * it lays text out left to right: it has no bidi algorithm. So an Arabic phrase is drawn with its
 * words in reverse order. OgText splits the text into direction runs and lays them out in a
 * `row-reverse` flex row for RTL locales: the first word sits on the right and lines wrap in the
 * right order. Runs of Latin letters and digits ("2 - 1", "A. Sabiri", "120+1'") keep their own
 * left-to-right order inside one run.
 *
 * Each Arabic word is pre-shaped into presentation forms (arabic-shape.ts) so Satori measures the
 * joined glyphs it draws. Without that, every word box was measured with the wider isolated
 * glyphs and the words were drawn with big gaps between them.
 */

const ARABIC = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
const STRONG_LTR = /[A-Za-z0-9\u00C0-\u024F]/;
const MIRROR: Record<string, string> = {
  '(': ')',
  ')': '(',
  '[': ']',
  ']': '[',
  '«': '»',
  '»': '«',
};

export type OgRun = { dir: 'rtl' | 'ltr'; text: string };

export const isRtlLocale = (locale: string) => locale === 'ar';

/** Leading/trailing punctuation of an Arabic word is drawn on the opposite side, mirrored. */
function visualRtlWord(word: string): string {
  const m = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u.exec(word);
  if (!m) return word;
  const [, lead, core, trail] = m;
  const flip = (s: string) =>
    [...s]
      .reverse()
      .map((c) => MIRROR[c] ?? c)
      .join('');
  // Digits inside an Arabic word ("الـ16") read left to right but sit on the word's left.
  const parts = core.match(/\p{N}+|[^\p{N}]+/gu) ?? [core];
  return `${flip(trail)}${parts.reverse().join('')}${flip(lead)}`;
}

/**
 * Split `text` into direction runs in logical order. For LTR locales the whole text is one run.
 * In RTL text a neutral token (punctuation, "-", "·") joins an LTR run only when it sits between
 * two LTR tokens ("2 - 1"); otherwise it stands on its own and follows the Arabic order.
 */
export function ogRuns(text: string, locale: string): OgRun[] {
  if (!isRtlLocale(locale) || !ARABIC.test(text)) return [{ dir: 'ltr', text }];
  const words = text.split(/\s+/).filter(Boolean);
  const kind = words.map((w) => (ARABIC.test(w) ? 'rtl' : STRONG_LTR.test(w) ? 'ltr' : 'neutral'));
  const resolved = kind.map((k, i) => {
    if (k !== 'neutral') return k;
    const prev = kind
      .slice(0, i)
      .reverse()
      .find((x) => x !== 'neutral');
    const next = kind.slice(i + 1).find((x) => x !== 'neutral');
    return prev === 'ltr' && next === 'ltr' ? 'ltr' : 'rtl';
  });
  const runs: OgRun[] = [];
  words.forEach((w, i) => {
    const dir = resolved[i] as 'rtl' | 'ltr';
    const last = runs[runs.length - 1];
    if (dir === 'ltr' && last?.dir === 'ltr') last.text += ` ${w}`;
    else runs.push({ dir, text: dir === 'rtl' ? visualRtlWord(w) : w });
  });
  return runs;
}

/** A text line for an OG image, laid out right to left on /ar (see ogRuns). */
export function OgText({
  text,
  locale,
  style,
}: {
  text: string;
  locale: string;
  style?: CSSProperties;
}) {
  const runs = ogRuns(text, locale);
  const fontSize = typeof style?.fontSize === 'number' ? style.fontSize : 24;
  const rtl = runs.length > 1 || runs[0]?.dir === 'rtl';
  if (!rtl) return <div style={{ display: 'flex', ...style }}>{text}</div>;
  // The outer box takes the caller's layout (maxWidth, margins, alignment). The inner row is
  // shrink-wrapped around the words, so columnGap is the only space between them, and still wraps
  // when a line is longer than the outer box.
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        ...style,
        // Letter-spacing and uppercase break Arabic joining; they only make sense for Latin.
        letterSpacing: 0,
        textTransform: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row-reverse',
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: 'auto',
          alignSelf: 'center',
          flexGrow: 0,
          columnGap: Math.round(fontSize * 0.236), // the font's space advance (236/1000 em)
        }}
      >
        {runs.map((r, i) => (
          <span key={i}>{r.dir === 'rtl' ? visualArabic(r.text) : r.text}</span>
        ))}
      </div>
    </div>
  );
}
