// Database schema — Part H of the plan, translated to Drizzle ORM.
//
// bigint columns use { mode: "number" } because all API-Football IDs fit
// comfortably within Number.MAX_SAFE_INTEGER (2^53 ≈ 9 quadrillion).
// Player IDs reach 400k+, league IDs ~1k, fixture IDs ~1M — all well
// within safe integer range for the foreseeable future.

import { relations } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  text,
  bigint,
  integer,
  boolean,
  date,
  timestamp,
  jsonb,
  serial,
  bigserial,
  numeric,
  index,
  uniqueIndex,
  unique,
  primaryKey,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Enums ───

export const videoCategoryEnum = pgEnum('video_category', [
  'highlights',
  'goals',
  'interview',
  'analysis',
  'preview',
  'documentary',
  'news',
  'training',
]);

// ─── Reference ───

export const countries = pgTable('countries', {
  code: text('code').primaryKey(),
  name: jsonb('name').notNull().$type<Record<string, string>>(),
  flagUrl: text('flag_url'),
});

export const competitions = pgTable(
  'competitions',
  {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    slug: text('slug').unique().notNull(),
    name: jsonb('name').notNull().$type<Record<string, string>>(),
    countryCode: text('country_code').references(() => countries.code),
    type: text('type').notNull(), // 'League' | 'Cup'
    tier: integer('tier'),
    isWomen: boolean('is_women').default(false),
    logoUrl: text('logo_url'),
    primaryColor: text('primary_color'),
    isFeatured: boolean('is_featured').default(false),
    isMoroccoFocus: boolean('is_morocco_focus').default(false),
    displayPriority: integer('display_priority').default(100),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('competitions_country_code_idx').on(t.countryCode),
    index('competitions_is_women_idx').on(t.isWomen),
  ],
);

export const seasons = pgTable(
  'seasons',
  {
    competitionId: bigint('competition_id', { mode: 'number' })
      .notNull()
      .references(() => competitions.id),
    year: integer('year').notNull(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    isCurrent: boolean('is_current').default(false),
  },
  (t) => [primaryKey({ columns: [t.competitionId, t.year] })],
);

export const leagueCoverage = pgTable(
  'league_coverage',
  {
    leagueId: bigint('league_id', { mode: 'number' })
      .notNull()
      .references(() => competitions.id),
    season: integer('season').notNull(),
    events: boolean('events'),
    lineups: boolean('lineups'),
    statisticsFixtures: boolean('statistics_fixtures'),
    statisticsPlayers: boolean('statistics_players'),
    standings: boolean('standings'),
    players: boolean('players'),
    topScorers: boolean('top_scorers'),
    topAssists: boolean('top_assists'),
    topCards: boolean('top_cards'),
    injuries: boolean('injuries'),
    predictions: boolean('predictions'),
    odds: boolean('odds'),
    syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.leagueId, t.season] })],
);

// ─── Entities ───

export const venues = pgTable('venues', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  name: text('name'),
  city: text('city'),
  countryCode: text('country_code'),
  capacity: integer('capacity'),
  surface: text('surface'),
  imageUrl: text('image_url'),
});

export const teams = pgTable(
  'teams',
  {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    slug: text('slug').unique().notNull(),
    name: jsonb('name').notNull().$type<Record<string, string>>(),
    shortName: jsonb('short_name').notNull().$type<Record<string, string>>(),
    code: text('code'),
    countryCode: text('country_code').references(() => countries.code),
    founded: integer('founded'),
    logoUrl: text('logo_url'),
    venueId: bigint('venue_id', { mode: 'number' }).references(() => venues.id),
    primaryColor: text('primary_color'),
    secondaryColor: text('secondary_color'),
    isNational: boolean('is_national').default(false),
    isWomen: boolean('is_women').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('teams_country_code_idx').on(t.countryCode),
    index('teams_is_women_idx').on(t.isWomen),
  ],
);

export const players = pgTable(
  'players',
  {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    slug: text('slug').unique().notNull(),
    name: jsonb('name').notNull().$type<Record<string, string>>(),
    firstname: text('firstname'),
    lastname: text('lastname'),
    birthDate: date('birth_date'),
    birthPlace: text('birth_place'),
    birthCountryCode: text('birth_country_code'),
    nationalityCode: text('nationality_code'),
    height: text('height'),
    weight: text('weight'),
    photoUrl: text('photo_url'),
    currentTeamId: bigint('current_team_id', { mode: 'number' }).references(() => teams.id),
    position: text('position'),
    shirtNumber: integer('shirt_number'),
    injured: boolean('injured').default(false),
    isWomen: boolean('is_women').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('players_current_team_id_idx').on(t.currentTeamId),
    index('players_is_women_idx').on(t.isWomen),
  ],
);

export const squadMembers = pgTable(
  'squad_members',
  {
    teamId: bigint('team_id', { mode: 'number' })
      .notNull()
      .references(() => teams.id),
    playerId: bigint('player_id', { mode: 'number' })
      .notNull()
      .references(() => players.id),
  },
  (t) => [
    primaryKey({ columns: [t.teamId, t.playerId] }),
    index('squad_members_team_id_idx').on(t.teamId),
  ],
);

export const coaches = pgTable(
  'coaches',
  {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    name: text('name').notNull(),
    firstname: text('firstname'),
    lastname: text('lastname'),
    birthDate: date('birth_date'),
    nationalityCode: text('nationality_code'),
    photoUrl: text('photo_url'),
    currentTeamId: bigint('current_team_id', { mode: 'number' }).references(() => teams.id),
    career: jsonb('career'),
  },
  (t) => [index('coaches_current_team_id_idx').on(t.currentTeamId)],
);

// ─── Fixtures + live ───

export const fixtures = pgTable(
  'fixtures',
  {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    competitionId: bigint('competition_id', { mode: 'number' }).references(() => competitions.id),
    seasonYear: integer('season_year').notNull(),
    round: text('round'),
    roundNumber: integer('round_number'),
    kickoffAt: timestamp('kickoff_at', { withTimezone: true }).notNull(),
    statusCode: text('status_code').notNull(),
    minute: integer('minute'),
    extraMinute: integer('extra_minute'),
    homeTeamId: bigint('home_team_id', { mode: 'number' }).references(() => teams.id),
    awayTeamId: bigint('away_team_id', { mode: 'number' }).references(() => teams.id),
    homeScore: integer('home_score'),
    awayScore: integer('away_score'),
    homeScoreHt: integer('home_score_ht'),
    awayScoreHt: integer('away_score_ht'),
    homeScoreFt: integer('home_score_ft'),
    awayScoreFt: integer('away_score_ft'),
    homeScoreEt: integer('home_score_et'),
    awayScoreEt: integer('away_score_et'),
    homeScorePen: integer('home_score_pen'),
    awayScorePen: integer('away_score_pen'),
    venueId: bigint('venue_id', { mode: 'number' }).references(() => venues.id),
    referee: text('referee'),
    isFeatured: boolean('is_featured').default(false),
    detailsSyncedAt: timestamp('details_synced_at', { withTimezone: true }).default(sql`NULL`),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('fixtures_kickoff_at_idx').on(t.kickoffAt),
    index('fixtures_live_status_idx')
      .on(t.statusCode)
      .where(sql`status_code IN ('1H','HT','2H','ET','BT','P','LIVE')`),
    index('fixtures_competition_season_round_idx').on(t.competitionId, t.seasonYear, t.roundNumber),
    index('fixtures_home_team_id_idx').on(t.homeTeamId),
    index('fixtures_away_team_id_idx').on(t.awayTeamId),
  ],
);

export const fixtureEvents = pgTable(
  'fixture_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    fixtureId: bigint('fixture_id', { mode: 'number' })
      .notNull()
      .references(() => fixtures.id, { onDelete: 'cascade' }),
    teamId: bigint('team_id', { mode: 'number' }).references(() => teams.id),
    playerId: bigint('player_id', { mode: 'number' }).references(() => players.id),
    assistPlayerId: bigint('assist_player_id', { mode: 'number' }).references(() => players.id),
    minute: integer('minute'),
    extraMinute: integer('extra_minute'),
    type: text('type').notNull(),
    detail: text('detail'),
    comments: text('comments'),
  },
  (t) => [index('fixture_events_fixture_minute_idx').on(t.fixtureId, t.minute)],
);

export const fixtureLineups = pgTable(
  'fixture_lineups',
  {
    fixtureId: bigint('fixture_id', { mode: 'number' })
      .notNull()
      .references(() => fixtures.id, { onDelete: 'cascade' }),
    teamId: bigint('team_id', { mode: 'number' })
      .notNull()
      .references(() => teams.id),
    coachId: bigint('coach_id', { mode: 'number' }).references(() => coaches.id),
    formation: text('formation'),
    starters: jsonb('starters').notNull(),
    substitutes: jsonb('substitutes').notNull(),
  },
  (t) => [primaryKey({ columns: [t.fixtureId, t.teamId] })],
);

export const fixtureStatistics = pgTable(
  'fixture_statistics',
  {
    fixtureId: bigint('fixture_id', { mode: 'number' })
      .notNull()
      .references(() => fixtures.id, { onDelete: 'cascade' }),
    teamId: bigint('team_id', { mode: 'number' })
      .notNull()
      .references(() => teams.id),
    stats: jsonb('stats').notNull(),
  },
  (t) => [primaryKey({ columns: [t.fixtureId, t.teamId] })],
);

export const fixturePlayerStats = pgTable(
  'fixture_player_stats',
  {
    fixtureId: bigint('fixture_id', { mode: 'number' })
      .notNull()
      .references(() => fixtures.id, { onDelete: 'cascade' }),
    teamId: bigint('team_id', { mode: 'number' })
      .notNull()
      .references(() => teams.id),
    playerId: bigint('player_id', { mode: 'number' })
      .notNull()
      .references(() => players.id),
    minutesPlayed: integer('minutes_played'),
    rating: numeric('rating', { precision: 3, scale: 1 }),
    captain: boolean('captain'),
    position: text('position'),
    substitute: boolean('substitute'),
    stats: jsonb('stats').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.fixtureId, t.playerId] }),
    index('fixture_player_stats_player_id_idx').on(t.playerId),
  ],
);

// ─── Standings ───

export const standings = pgTable(
  'standings',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    competitionId: bigint('competition_id', { mode: 'number' }).references(() => competitions.id),
    seasonYear: integer('season_year').notNull(),
    groupLabel: text('group_label').notNull(),
    teamId: bigint('team_id', { mode: 'number' }).references(() => teams.id),
    rank: integer('rank').notNull(),
    points: integer('points').notNull(),
    played: integer('played').notNull(),
    won: integer('won'),
    drawn: integer('drawn'),
    lost: integer('lost'),
    goalsFor: integer('goals_for'),
    goalsAgainst: integer('goals_against'),
    goalDiff: integer('goal_diff'),
    form: text('form'),
    description: text('description'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    unique('standings_unique').on(t.competitionId, t.seasonYear, t.groupLabel, t.teamId),
    index('standings_competition_season_group_rank_idx').on(
      t.competitionId,
      t.seasonYear,
      t.groupLabel,
      t.rank,
    ),
  ],
);

// ─── Aggregates ───

export const playerSeasonStats = pgTable(
  'player_season_stats',
  {
    playerId: bigint('player_id', { mode: 'number' })
      .notNull()
      .references(() => players.id),
    teamId: bigint('team_id', { mode: 'number' })
      .notNull()
      .references(() => teams.id),
    competitionId: bigint('competition_id', { mode: 'number' })
      .notNull()
      .references(() => competitions.id),
    seasonYear: integer('season_year').notNull(),
    stats: jsonb('stats').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.playerId, t.teamId, t.competitionId, t.seasonYear] }),
    index('player_season_stats_competition_season_idx').on(t.competitionId, t.seasonYear),
  ],
);

export const teamSeasonStats = pgTable(
  'team_season_stats',
  {
    teamId: bigint('team_id', { mode: 'number' })
      .notNull()
      .references(() => teams.id),
    competitionId: bigint('competition_id', { mode: 'number' })
      .notNull()
      .references(() => competitions.id),
    seasonYear: integer('season_year').notNull(),
    stats: jsonb('stats').notNull(),
  },
  (t) => [primaryKey({ columns: [t.teamId, t.competitionId, t.seasonYear] })],
);

export const transfers = pgTable(
  'transfers',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    playerId: bigint('player_id', { mode: 'number' }).references(() => players.id),
    date: date('date'),
    type: text('type'),
    fromTeamId: bigint('from_team_id', { mode: 'number' }).references(() => teams.id),
    toTeamId: bigint('to_team_id', { mode: 'number' }).references(() => teams.id),
    fee: text('fee'),
  },
  (t) => [index('transfers_player_id_idx').on(t.playerId)],
);

export const playerTrophies = pgTable(
  'player_trophies',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    playerId: bigint('player_id', { mode: 'number' })
      .notNull()
      .references(() => players.id),
    league: text('league').notNull(),
    country: text('country'),
    season: text('season'),
    place: text('place'),
  },
  (t) => [index('player_trophies_player_id_idx').on(t.playerId)],
);

export const injuries = pgTable(
  'injuries',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    playerId: bigint('player_id', { mode: 'number' }).references(() => players.id),
    teamId: bigint('team_id', { mode: 'number' }).references(() => teams.id),
    fixtureId: bigint('fixture_id', { mode: 'number' }).references(() => fixtures.id),
    type: text('type'),
    reason: text('reason'),
    date: date('date'),
  },
  (t) => [
    index('injuries_fixture_id_idx').on(t.fixtureId),
    index('injuries_player_id_idx').on(t.playerId),
  ],
);

// ─── Predictions ───

export const predictions = pgTable('predictions', {
  fixtureId: bigint('fixture_id', { mode: 'number' })
    .primaryKey()
    .references(() => fixtures.id, { onDelete: 'cascade' }),
  winnerId: bigint('winner_id', { mode: 'number' }).references(() => teams.id),
  winnerComment: text('winner_comment'),
  winOrDraw: boolean('win_or_draw'),
  underOver: text('under_over'),
  goalsHome: text('goals_home'),
  goalsAway: text('goals_away'),
  advice: text('advice'),
  percentHome: integer('percent_home'),
  percentDraw: integer('percent_draw'),
  percentAway: integer('percent_away'),
  comparison: jsonb('comparison'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── Media ───

export const mediaVideos = pgTable(
  'media_videos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    youtubeId: text('youtube_id').unique().notNull(),
    title: text('title').notNull(),
    channelName: text('channel_name'),
    channelUrl: text('channel_url'),
    thumbnailUrl: text('thumbnail_url'),
    duration: integer('duration'),
    category: videoCategoryEnum('category').notNull(),
    language: text('language').default('fr'),
    competitionIds: bigint('competition_ids', { mode: 'number' })
      .array()
      .default(sql`'{}'::bigint[]`),
    teamIds: bigint('team_ids', { mode: 'number' })
      .array()
      .default(sql`'{}'::bigint[]`),
    fixtureIds: bigint('fixture_ids', { mode: 'number' })
      .array()
      .default(sql`'{}'::bigint[]`),
    playerIds: bigint('player_ids', { mode: 'number' })
      .array()
      .default(sql`'{}'::bigint[]`),
    addedBy: uuid('added_by'),
    publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow(),
    isFeatured: boolean('is_featured').default(false),
    isArchived: boolean('is_archived').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index('media_videos_competition_ids_idx').using('gin', t.competitionIds),
    index('media_videos_team_ids_idx').using('gin', t.teamIds),
    index('media_videos_fixture_ids_idx').using('gin', t.fixtureIds),
    index('media_videos_player_ids_idx').using('gin', t.playerIds),
    index('media_videos_category_published_idx')
      .on(t.category, t.publishedAt)
      .where(sql`is_archived = false`),
  ],
);

// ─── User layer ───

export const userFavorites = pgTable(
  'user_favorites',
  {
    userId: uuid('user_id').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: bigint('entity_id', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.entityType, t.entityId] })],
);

export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').primaryKey(),
  role: text('role').notNull().default('user'), // 'user' | 'admin'
});
