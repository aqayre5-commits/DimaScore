/**
 * Fallback crest palette. Prefer a known team colour (kit / lineup / teams.primary_color);
 * otherwise neutral tokens that hold AA contrast for the initials in light and dark.
 */

export type FallbackPalette = {
  fill: string;
  ink: string;
  stroke: string;
};

function parseHex(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let h = raw.trim();
  if (h.startsWith('#')) h = h.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return `#${h.toLowerCase()}`;
}

function lum(hex: string): number {
  const n = hex.slice(1);
  const ch = (i: number) => {
    const v = parseInt(n.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(0) + 0.7152 * ch(2) + 0.0722 * ch(4);
}

function contrast(a: string, b: string): number {
  const l1 = lum(a);
  const l2 = lum(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function mix(hex: string, toward: string, amount: number): string {
  const a = hex.slice(1);
  const b = toward.slice(1);
  const ch = (s: string, i: number) => parseInt(s.slice(i, i + 2), 16);
  const m = (i: number) => Math.round(ch(a, i) * (1 - amount) + ch(b, i) * amount);
  const h = (n: number) => n.toString(16).padStart(2, '0');
  return `#${h(m(0))}${h(m(2))}${h(m(4))}`;
}

const INK_DARK = '#101512';
const INK_LIGHT = '#f4f7f5';
const PAGE_LIGHT = '#ffffff';
const PAGE_DARK = '#101512';

/** Neutral fills: mid green-grey, AA vs both initials options and visible on both themes. */
export const NEUTRAL_LIGHT: FallbackPalette = {
  fill: '#2c4f3f',
  ink: INK_LIGHT,
  stroke: '#1a2f26',
};
export const NEUTRAL_DARK: FallbackPalette = {
  fill: '#9eb5a9',
  ink: INK_DARK,
  stroke: '#d5e0db',
};

function inkOn(fill: string): string {
  return contrast(fill, INK_LIGHT) >= contrast(fill, INK_DARK) ? INK_LIGHT : INK_DARK;
}

/**
 * Build a fill/ink/stroke pair. `theme` is only used for the neutral fallback;
 * a known team colour is adjusted so initials stay ≥ 4.5:1 and the shield stays
 * visible on both light and dark page backgrounds.
 */
export function fallbackPalette(
  primary?: string | null,
  secondary?: string | null,
  theme?: 'light' | 'dark' | null,
): FallbackPalette {
  const fill0 = parseHex(primary);
  if (!fill0) return theme === 'dark' ? NEUTRAL_DARK : NEUTRAL_LIGHT;

  let fill = fill0;
  // Keep the shield visible on white and on near-black cards.
  if (contrast(fill, PAGE_LIGHT) < 1.6) fill = mix(fill, INK_DARK, 0.35);
  if (contrast(fill, PAGE_DARK) < 1.6) fill = mix(fill, INK_LIGHT, 0.35);

  let ink = inkOn(fill);
  if (contrast(fill, ink) < 4.5) {
    // Push fill away from mid-greys until AA clears.
    const toward = lum(fill) > 0.4 ? INK_DARK : INK_LIGHT;
    for (const amt of [0.2, 0.35, 0.5, 0.65]) {
      const next = mix(fill, toward, amt);
      const nextInk = inkOn(next);
      if (contrast(next, nextInk) >= 4.5) {
        fill = next;
        ink = nextInk;
        break;
      }
    }
    if (contrast(fill, ink) < 4.5) {
      return theme === 'dark' ? NEUTRAL_DARK : NEUTRAL_LIGHT;
    }
  }

  const strokeRaw = parseHex(secondary);
  const stroke = strokeRaw && contrast(strokeRaw, fill) >= 1.4 ? strokeRaw : mix(fill, ink, 0.35);
  return { fill, ink, stroke };
}

export { parseHex as parseLogoColor, contrast as logoContrast };
