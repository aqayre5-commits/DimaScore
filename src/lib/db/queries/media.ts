import { eq, and, desc, ilike, sql, arrayContains } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../schema';
import { escapeLikePattern } from '@/lib/utils/sql';

// ── Types ──

export type MediaVideo = typeof schema.mediaVideos.$inferSelect;
type InsertMediaVideo = typeof schema.mediaVideos.$inferInsert;

export interface MediaVideoFilters {
  competitionId?: number;
  teamId?: number;
  fixtureId?: number;
  playerId?: number;
  category?: (typeof schema.videoCategoryEnum.enumValues)[number];
  isFeatured?: boolean;
  isArchived?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

// ── Queries ──

export async function getMediaVideos(
  db: NeonHttpDatabase<typeof schema>,
  filters: MediaVideoFilters = {},
): Promise<{ videos: MediaVideo[]; total: number }> {
  const {
    competitionId,
    teamId,
    fixtureId,
    playerId,
    category,
    isFeatured,
    isArchived = false,
    search,
    limit = 20,
    offset = 0,
  } = filters;

  const conditions = [];

  conditions.push(eq(schema.mediaVideos.isArchived, isArchived));

  if (competitionId != null) {
    conditions.push(arrayContains(schema.mediaVideos.competitionIds, [competitionId]));
  }
  if (teamId != null) {
    conditions.push(arrayContains(schema.mediaVideos.teamIds, [teamId]));
  }
  if (fixtureId != null) {
    conditions.push(arrayContains(schema.mediaVideos.fixtureIds, [fixtureId]));
  }
  if (playerId != null) {
    conditions.push(arrayContains(schema.mediaVideos.playerIds, [playerId]));
  }
  if (category) {
    conditions.push(eq(schema.mediaVideos.category, category));
  }
  if (isFeatured != null) {
    conditions.push(eq(schema.mediaVideos.isFeatured, isFeatured));
  }
  if (search) {
    conditions.push(ilike(schema.mediaVideos.title, `%${escapeLikePattern(search)}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const clampedLimit = Math.min(Math.max(limit, 1), 50);

  const [videos, countResult] = await Promise.all([
    db
      .select()
      .from(schema.mediaVideos)
      .where(where)
      .orderBy(desc(schema.mediaVideos.publishedAt))
      .limit(clampedLimit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.mediaVideos)
      .where(where),
  ]);

  return { videos, total: countResult[0]?.count ?? 0 };
}

export async function getMediaVideoById(
  db: NeonHttpDatabase<typeof schema>,
  id: string,
): Promise<MediaVideo | null> {
  const rows = await db
    .select()
    .from(schema.mediaVideos)
    .where(eq(schema.mediaVideos.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function createMediaVideo(
  db: NeonHttpDatabase<typeof schema>,
  data: InsertMediaVideo,
): Promise<MediaVideo> {
  const rows = await db.insert(schema.mediaVideos).values(data).returning();

  return rows[0];
}

export async function updateMediaVideo(
  db: NeonHttpDatabase<typeof schema>,
  id: string,
  data: Partial<InsertMediaVideo>,
): Promise<MediaVideo | null> {
  const rows = await db
    .update(schema.mediaVideos)
    .set(data)
    .where(eq(schema.mediaVideos.id, id))
    .returning();

  return rows[0] ?? null;
}

export async function deleteMediaVideo(
  db: NeonHttpDatabase<typeof schema>,
  id: string,
): Promise<boolean> {
  const rows = await db
    .delete(schema.mediaVideos)
    .where(eq(schema.mediaVideos.id, id))
    .returning({ id: schema.mediaVideos.id });

  return rows.length > 0;
}
