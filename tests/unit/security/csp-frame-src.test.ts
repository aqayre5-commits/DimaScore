import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import nextConfig from '../../../next.config';

// VideoPlayerModal renders react-lite-youtube-embed with cookie={false}, which embeds from
// www.youtube-nocookie.com. If the CSP frame-src does not allow that host, every video is blocked.
// Nothing else frames anything, so frame-src lists that host and nothing more.
describe('CSP frame-src', () => {
  it('is exactly the host the video player embeds from', async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const csp = rules
      .flatMap((r) => r.headers)
      .find((h) => h.key === 'Content-Security-Policy')?.value;
    const frameSrc = csp
      ?.split(';')
      .map((d) => d.trim())
      .find((d) => d.startsWith('frame-src'));
    expect(frameSrc).toBe('frame-src https://www.youtube-nocookie.com');
  });

  it('the only embed is the privacy-enhanced player, and nothing else renders an iframe', () => {
    const root = process.cwd();
    const modal = readFileSync(join(root, 'src/components/media/VideoPlayerModal.tsx'), 'utf8');
    expect(modal).toMatch(/cookie=\{false\}/);
    const read = (pattern: string) =>
      execSync(`grep -rlE '${pattern}' src --include=*.ts --include=*.tsx || true`, { cwd: root })
        .toString()
        .split('\n')
        .filter(Boolean)
        .sort();
    // The only component that mounts the embed lib, and no hand-written <iframe> in app code.
    expect(read('<LiteYouTubeEmbed')).toEqual(['src/components/media/VideoPlayerModal.tsx']);
    expect(read('<iframe|iframe-?src|oembed\\.html')).toEqual([]);
  });
});
