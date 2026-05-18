import { NextResponse } from 'next/server';
import { parseYoutubeId, fetchOembed } from '@/lib/utils/youtube';

export async function GET(request: Request) {
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
    const message = err instanceof Error ? err.message : 'oEmbed fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
