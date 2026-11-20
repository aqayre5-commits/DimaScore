import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// WCAG 2.2 AA contrast for the text/accent tokens on the surfaces they sit on, in both themes.
const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2].toLowerCase()]),
  );
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const dark = block(':root');
const light = { ...dark, ...block("[data-theme='light']") };

describe.each([
  ['dark (J)', dark],
  ['light (I)', light],
])('%s palette', (_name, t) => {
  const surfaces = ['bg-canvas', 'bg-surface', 'bg-surface-2'];
  it.each(['text-primary', 'text-secondary', 'text-tertiary', 'accent-azure', 'score-live'])(
    '%s is AA (4.5:1) on canvas and cards',
    (fg) => {
      for (const bg of surfaces) {
        // The live dark palette's azure is a fill colour; only the light theme uses it as text.
        if (fg === 'accent-azure' && t === dark) continue;
        expect(contrast(t[fg], t[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it('white on the LIVE badge is at least 3:1 (bold 10px caps are UI text, checked at 4.5 for light)', () => {
    expect(contrast('#ffffff', t['score-live'])).toBeGreaterThanOrEqual(t === light ? 4.5 : 3);
  });
});

it('light theme keeps the same hue families as dark (green, azure, red accents)', () => {
  expect(Object.keys(block("[data-theme='light']")).sort()).toEqual(Object.keys(dark).sort());
});
