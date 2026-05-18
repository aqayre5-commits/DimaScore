import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth/admin';
import { videoCategoryEnum } from '@/lib/db/schema';
import { getMediaVideoById, updateMediaVideo, deleteMediaVideo } from '@/lib/db/queries/media';

const VALID_CATEGORIES = new Set(videoCategoryEnum.enumValues);

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const existing = await getMediaVideoById(db, id);
  if (!existing) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Build the update payload from allowed fields only
  const update: Record<string, unknown> = {};

  if (typeof body.title === 'string') update.title = body.title;
  if (typeof body.channelName === 'string') update.channelName = body.channelName;
  if (typeof body.channelUrl === 'string') update.channelUrl = body.channelUrl;
  if (typeof body.thumbnailUrl === 'string') update.thumbnailUrl = body.thumbnailUrl;
  if (body.duration != null) update.duration = Number(body.duration);
  if (typeof body.language === 'string') update.language = body.language;
  if (typeof body.isFeatured === 'boolean') update.isFeatured = body.isFeatured;
  if (typeof body.isArchived === 'boolean') update.isArchived = body.isArchived;
  if (Array.isArray(body.competitionIds)) update.competitionIds = body.competitionIds.map(Number);
  if (Array.isArray(body.teamIds)) update.teamIds = body.teamIds.map(Number);
  if (Array.isArray(body.fixtureIds)) update.fixtureIds = body.fixtureIds.map(Number);
  if (Array.isArray(body.playerIds)) update.playerIds = body.playerIds.map(Number);

  if (typeof body.category === 'string') {
    if (!VALID_CATEGORIES.has(body.category as never)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${[...VALID_CATEGORIES].join(', ')}` },
        { status: 400 },
      );
    }
    update.category = body.category;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const updated = await updateMediaVideo(db, id, update);
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const deleted = await deleteMediaVideo(db, id);
  if (!deleted) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
