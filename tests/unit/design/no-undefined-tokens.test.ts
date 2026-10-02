import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Guard against undefined design-token classes (the `bg-bg-raised` / `text-text-quaternary` class
 * of bug): Tailwind silently emits nothing for a `{util}-{family}-{name}` class whose
 * `{family}-{name}` isn't a defined `--color-*` token, so the element renders unstyled.
 *
 * This extracts the defined color tokens from tokens.css + globals.css, then scans src for themed
 * color classes (families: text/bg/border/accent/score) and fails on any that don't resolve.
 */
const ROOT = path.resolve(__dirname, '../../..');
const CSS_FILES = ['src/styles/tokens.css', 'src/app/globals.css'];
const FAMILIES = ['text', 'bg', 'border', 'accent', 'score'];
// Utilities that take a color token.
const UTIL =
  'bg|text|border|divide|fill|stroke|ring|outline|from|via|to|ring-offset|caret|accent|decoration|shadow';
const CLASS_RE = new RegExp(`\\b(?:${UTIL})-((?:${FAMILIES.join('|')})(?:-[a-z0-9]+)+)\\b`, 'g');

function definedTokens(): Set<string> {
  const tokens = new Set<string>();
  for (const rel of CSS_FILES) {
    const css = readFileSync(path.join(ROOT, rel), 'utf8');
    for (const m of css.matchAll(/--color-([a-z0-9-]+)\s*:/g)) tokens.add(m[1]);
  }
  return tokens;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(e.name)) out.push(p);
  }
  return out;
}

describe('design tokens', () => {
  it('every themed color class resolves to a defined --color-* token', () => {
    const defined = definedTokens();
    const offenders: string[] = [];
    for (const file of walk(path.join(ROOT, 'src'))) {
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(CLASS_RE)) {
        const token = m[1]; // e.g. "bg-surface-2", "text-tertiary", "accent-amber"
        if (!defined.has(token)) {
          offenders.push(`${path.relative(ROOT, file)}: ${m[0]} (undefined token "${token}")`);
        }
      }
    }
    expect(offenders, `Undefined design-token classes found:\n${offenders.join('\n')}`).toEqual([]);
  });
});
