// YouTube URL parsing and oEmbed fetching utilities.

// ── Types ──

export interface YouTubeOembedResponse {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
  html: string;
  width: number;
  height: number;
  type: string;
  version: string;
  provider_name: string;
  provider_url: string;
}

// ── URL parsing ──

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extract the 11-character video ID from a YouTube URL.
 *
 * Supported formats:
 *   https://www.youtube.com/watch?v=VIDEO_ID
 *   https://youtube.com/watch?v=VIDEO_ID
 *   https://m.youtube.com/watch?v=VIDEO_ID
 *   https://youtu.be/VIDEO_ID
 *   https://www.youtube.com/embed/VIDEO_ID
 *   https://www.youtube.com/shorts/VIDEO_ID
 *
 * Returns null if the URL is invalid or the ID cannot be extracted.
 */
export function parseYoutubeId(input: string): string | null {
  const trimmed = input.trim();

  // If the input is already a bare 11-char ID, accept it
  if (YOUTUBE_ID_RE.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');

  // youtu.be/VIDEO_ID
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0];
    return id && YOUTUBE_ID_RE.test(id) ? id : null;
  }

  // youtube.com variants
  if (host !== 'youtube.com') return null;

  // /watch?v=VIDEO_ID
  if (url.pathname === '/watch') {
    const id = url.searchParams.get('v');
    return id && YOUTUBE_ID_RE.test(id) ? id : null;
  }

  // /embed/VIDEO_ID or /shorts/VIDEO_ID
  const pathMatch = url.pathname.match(/^\/(embed|shorts)\/([A-Za-z0-9_-]{11})/);
  if (pathMatch) return pathMatch[2];

  return null;
}

// ── oEmbed ──

/**
 * Fetch YouTube oEmbed metadata for a video ID.
 * No API key required — uses the public oEmbed endpoint.
 */
export async function fetchOembed(videoId: string): Promise<YouTubeOembedResponse> {
  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;

  const res = await fetch(oembedUrl, { next: { revalidate: 0 } });

  if (!res.ok) {
    throw new Error(`YouTube oEmbed failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<YouTubeOembedResponse>;
}
