import { NextResponse } from 'next/server';
import { parseYoutubeId, fetchOembed } from '@/lib/utils/youtube';

const rateMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_REQUESTS;
}

export async function GET(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing "url" query parameter' }, { status: 400 });
  }

  const videoId = parseYoutubeId(url);
  if (!videoId) {
    return NextResponse.json(
      { error: 'Could not parse YouTube video ID from URL' },
      { status: 400 },
    );
  }

  try {
    const oembed = await fetchOembed(videoId);
    return NextResponse.json({ videoId, ...oembed });
  } catch (err) {
    console.error('oEmbed fetch failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 502 });
  }
}
