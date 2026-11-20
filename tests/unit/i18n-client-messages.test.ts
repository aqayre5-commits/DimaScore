import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CLIENT_MESSAGE_NAMESPACES, pickClientMessages } from '@/lib/i18n/client-messages';
import en from '@/lib/i18n/messages/en.json';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|jsx?)$/.test(name) ? [p] : [];
  });
}

describe('client message namespaces', () => {
  const sources = walk(join(process.cwd(), 'src')).map((f) => readFileSync(f, 'utf8'));

  it('covers every useTranslations() namespace used in src/', () => {
    const used = new Set<string>();
    for (const src of sources) {
      for (const m of src.matchAll(/useTranslations\(\s*['"]([A-Za-z0-9_]+)/g)) used.add(m[1]);
    }
    const listed = new Set<string>(CLIENT_MESSAGE_NAMESPACES);
    expect([...used].filter((ns) => !listed.has(ns))).toEqual([]);
  });

  it('has no root-level useTranslations() / useMessages() that would need every namespace', () => {
    const offenders = sources.filter((s) => /useTranslations\(\s*\)|useMessages\(/.test(s));
    expect(offenders).toHaveLength(0);
  });

  it('drops server-only namespaces', () => {
    const picked = pickClientMessages(en as Record<string, unknown>);
    expect(Object.keys(picked)).not.toContain('botolaClassement');
    expect(picked.matchDetail).toEqual((en as Record<string, unknown>).matchDetail);
  });
});
