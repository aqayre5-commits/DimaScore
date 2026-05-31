import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth/admin';
import { videoCategoryEnum } from '@/lib/db/schema';
import { getMediaVideos, createMediaVideo, type MediaVideoFilters } from '@/lib/db/queries/media';

const VALID_CATEGORIES = new Set(videoCategoryEnum.enumValues);

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const filters: MediaVideoFilters = {};

  const parseIntParam = (v: string | null): number | undefined => {
    if (v == null) return undefined;
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? undefined : n;
  };

  const competitionId = parseIntParam(params.get('competitionId'));
  if (competitionId != null) filters.competitionId = competitionId;

  const teamId = parseIntParam(params.get('teamId'));
  if (teamId != null) filters.teamId = teamId;

  const fixtureId = parseIntParam(params.get('fixtureId'));
  if (fixtureId != null) filters.fixtureId = fixtureId;

  const playerId = parseIntParam(params.get('playerId'));
  if (playerId != null) filters.playerId = playerId;

  const category = params.get('category');
  if (category && VALID_CATEGORIES.has(category as never)) {
    filters.category = category as MediaVideoFilters['category'];
  }

  const isFeatured = params.get('isFeatured');
  if (isFeatured === 'true') filters.isFeatured = true;
  if (isFeatured === 'false') filters.isFeatured = false;

  const isArchived = params.get('isArchived');
  if (isArchived === 'true') filters.isArchived = true;

  const search = params.get('search');
  if (search) filters.search = search;

  const rawLimit = parseIntParam(params.get('limit'));
  if (rawLimit != null) filters.limit = Math.min(Math.max(rawLimit, 1), 50);

  const rawOffset = parseIntParam(params.get('offset'));
  if (rawOffset != null) filters.offset = Math.max(rawOffset, 0);

  const result = await getMediaVideos(db, filters);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { youtubeId, title, category } = body as {
    youtubeId?: string;
    title?: string;
    category?: string;
  };

  if (!youtubeId || !title || !category) {
    return NextResponse.json(
      { error: 'youtubeId, title, and category are required' },
      { status: 400 },
    );
  }

  if (!VALID_CATEGORIES.has(category as never)) {
    return NextResponse.json(
      { error: `Invalid category. Must be one of: ${[...VALID_CATEGORIES].join(', ')}` },
      { status: 400 },
    );
  }

  const video = await createMediaVideo(db, {
    youtubeId: body.youtubeId as string,
    title: body.title as string,
    category: category as (typeof videoCategoryEnum.enumValues)[number],
    channelName: (body.channelName as string) ?? null,
    channelUrl: (body.channelUrl as string) ?? null,
    thumbnailUrl: (body.thumbnailUrl as string) ?? null,
    duration: body.duration != null ? Number(body.duration) : null,
    language: (body.language as string) ?? 'fr',
    competitionIds: Array.isArray(body.competitionIds) ? body.competitionIds.map(Number) : [],
    teamIds: Array.isArray(body.teamIds) ? body.teamIds.map(Number) : [],
    fixtureIds: Array.isArray(body.fixtureIds) ? body.fixtureIds.map(Number) : [],
    playerIds: Array.isArray(body.playerIds) ? body.playerIds.map(Number) : [],
    isFeatured: body.isFeatured === true,
    addedBy: null,
  });

  return NextResponse.json(video, { status: 201 });
}
