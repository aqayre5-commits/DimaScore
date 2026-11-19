import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import nextConfig from '../../../next.config';

// VideoPlayerModal renders react-lite-youtube-embed with cookie={false}, which embeds from
// www.youtube-nocookie.com. If the CSP frame-src does not allow that host, every video is blocked.
describe('CSP frame-src', () => {
  it('allows the host the video player actually embeds from', async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const csp = rules
      .flatMap((r) => r.headers)
      .find((h) => h.key === 'Content-Security-Policy')?.value;
    const frameSrc = csp
      ?.split(';')
      .map((d) => d.trim())
      .find((d) => d.startsWith('frame-src'));
    expect(frameSrc?.split(/\s+/)).toContain('https://www.youtube-nocookie.com');

    const modal = readFileSync(
      join(process.cwd(), 'src/components/media/VideoPlayerModal.tsx'),
      'utf8',
    );
    expect(modal).toMatch(/cookie=\{false\}/);
  });
});
