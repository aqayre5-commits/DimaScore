CREATE TYPE "public"."video_category" AS ENUM('highlights', 'goals', 'interview', 'analysis', 'preview', 'documentary', 'news', 'training');--> statement-breakpoint
CREATE TABLE "coaches" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"firstname" text,
	"lastname" text,
	"birth_date" date,
	"nationality_code" text,
	"photo_url" text,
	"current_team_id" bigint,
	"career" jsonb
);
--> statement-breakpoint
CREATE TABLE "competitions" (
	"id" bigint PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb NOT NULL,
	"country_code" text,
	"type" text NOT NULL,
	"tier" integer,
	"is_women" boolean DEFAULT false,
	"logo_url" text,
	"primary_color" text,
	"is_featured" boolean DEFAULT false,
	"is_morocco_focus" boolean DEFAULT false,
	"display_priority" integer DEFAULT 100,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "competitions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"code" text PRIMARY KEY NOT NULL,
	"name" jsonb NOT NULL,
	"flag_url" text
);
--> statement-breakpoint
CREATE TABLE "fixture_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"fixture_id" bigint NOT NULL,
	"team_id" bigint,
	"player_id" bigint,
	"assist_player_id" bigint,
	"minute" integer NOT NULL,
	"extra_minute" integer,
	"type" text NOT NULL,
	"detail" text,
	"comments" text
);
--> statement-breakpoint
CREATE TABLE "fixture_lineups" (
	"fixture_id" bigint NOT NULL,
	"team_id" bigint NOT NULL,
	"coach_id" bigint,
	"formation" text,
	"starters" jsonb NOT NULL,
	"substitutes" jsonb NOT NULL,
	CONSTRAINT "fixture_lineups_fixture_id_team_id_pk" PRIMARY KEY("fixture_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "fixture_player_stats" (
	"fixture_id" bigint NOT NULL,
	"team_id" bigint NOT NULL,
	"player_id" bigint NOT NULL,
	"minutes_played" integer,
	"rating" numeric(3, 1),
	"captain" boolean,
	"position" text,
	"substitute" boolean,
	"stats" jsonb NOT NULL,
	CONSTRAINT "fixture_player_stats_fixture_id_player_id_pk" PRIMARY KEY("fixture_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "fixture_statistics" (
	"fixture_id" bigint NOT NULL,
	"team_id" bigint NOT NULL,
	"stats" jsonb NOT NULL,
	CONSTRAINT "fixture_statistics_fixture_id_team_id_pk" PRIMARY KEY("fixture_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "fixtures" (
	"id" bigint PRIMARY KEY NOT NULL,
	"competition_id" bigint,
	"season_year" integer NOT NULL,
	"round" text,
	"round_number" integer,
	"kickoff_at" timestamp with time zone NOT NULL,
	"status_code" text NOT NULL,
	"minute" integer,
	"extra_minute" integer,
	"home_team_id" bigint,
	"away_team_id" bigint,
	"home_score" integer,
	"away_score" integer,
	"home_score_ht" integer,
	"away_score_ht" integer,
	"home_score_ft" integer,
	"away_score_ft" integer,
	"home_score_et" integer,
	"away_score_et" integer,
	"home_score_pen" integer,
	"away_score_pen" integer,
	"venue_id" bigint,
	"referee" text,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "injuries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"player_id" bigint,
	"team_id" bigint,
	"fixture_id" bigint,
	"type" text,
	"reason" text,
	"date" date
);
--> statement-breakpoint
CREATE TABLE "league_coverage" (
	"league_id" bigint NOT NULL,
	"season" integer NOT NULL,
	"events" boolean,
	"lineups" boolean,
	"statistics_fixtures" boolean,
	"statistics_players" boolean,
	"standings" boolean,
	"players" boolean,
	"top_scorers" boolean,
	"top_assists" boolean,
	"top_cards" boolean,
	"injuries" boolean,
	"predictions" boolean,
	"odds" boolean,
	"synced_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "league_coverage_league_id_season_pk" PRIMARY KEY("league_id","season")
);
--> statement-breakpoint
CREATE TABLE "media_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"youtube_id" text NOT NULL,
	"title" text NOT NULL,
	"channel_name" text,
	"channel_url" text,
	"thumbnail_url" text,
	"duration" integer,
	"category" "video_category" NOT NULL,
	"language" text DEFAULT 'fr',
	"competition_ids" bigint[] DEFAULT '{}'::bigint[],
	"team_ids" bigint[] DEFAULT '{}'::bigint[],
	"fixture_ids" bigint[] DEFAULT '{}'::bigint[],
	"player_ids" bigint[] DEFAULT '{}'::bigint[],
	"added_by" uuid,
	"published_at" timestamp with time zone DEFAULT now(),
	"is_featured" boolean DEFAULT false,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "media_videos_youtube_id_unique" UNIQUE("youtube_id")
);
--> statement-breakpoint
CREATE TABLE "player_season_stats" (
	"player_id" bigint NOT NULL,
	"team_id" bigint NOT NULL,
	"competition_id" bigint NOT NULL,
	"season_year" integer NOT NULL,
	"stats" jsonb NOT NULL,
	CONSTRAINT "player_season_stats_player_id_team_id_competition_id_season_year_pk" PRIMARY KEY("player_id","team_id","competition_id","season_year")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" bigint PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb NOT NULL,
	"firstname" text,
	"lastname" text,
	"birth_date" date,
	"birth_place" text,
	"birth_country_code" text,
	"nationality_code" text,
	"height" text,
	"weight" text,
	"photo_url" text,
	"current_team_id" bigint,
	"position" text,
	"shirt_number" integer,
	"injured" boolean DEFAULT false,
	"is_women" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "players_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"fixture_id" bigint PRIMARY KEY NOT NULL,
	"winner_id" bigint,
	"winner_comment" text,
	"win_or_draw" boolean,
	"under_over" text,
	"goals_home" text,
	"goals_away" text,
	"advice" text,
	"percent_home" integer,
	"percent_draw" integer,
	"percent_away" integer,
	"comparison" jsonb,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"competition_id" bigint NOT NULL,
	"year" integer NOT NULL,
	"start_date" date,
	"end_date" date,
	"is_current" boolean DEFAULT false,
	CONSTRAINT "seasons_competition_id_year_pk" PRIMARY KEY("competition_id","year")
);
--> statement-breakpoint
CREATE TABLE "standings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"competition_id" bigint,
	"season_year" integer NOT NULL,
	"group_label" text NOT NULL,
	"team_id" bigint,
	"rank" integer NOT NULL,
	"points" integer NOT NULL,
	"played" integer NOT NULL,
	"won" integer,
	"drawn" integer,
	"lost" integer,
	"goals_for" integer,
	"goals_against" integer,
	"goal_diff" integer,
	"form" text,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "standings_unique" UNIQUE("competition_id","season_year","group_label","team_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" bigint PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb NOT NULL,
	"short_name" jsonb NOT NULL,
	"code" text,
	"country_code" text,
	"founded" integer,
	"logo_url" text,
	"venue_id" bigint,
	"primary_color" text,
	"secondary_color" text,
	"is_national" boolean DEFAULT false,
	"is_women" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "teams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "transfers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"player_id" bigint,
	"date" date,
	"type" text,
	"from_team_id" bigint,
	"to_team_id" bigint,
	"fee" text
);
--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"user_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_favorites_user_id_entity_type_entity_id_pk" PRIMARY KEY("user_id","entity_type","entity_id")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"role" text DEFAULT 'user' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" text,
	"city" text,
	"country_code" text,
	"capacity" integer,
	"surface" text,
	"image_url" text
);
--> statement-breakpoint
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_current_team_id_teams_id_fk" FOREIGN KEY ("current_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_country_code_countries_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixture_events" ADD CONSTRAINT "fixture_events_fixture_id_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixture_events" ADD CONSTRAINT "fixture_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixture_events" ADD CONSTRAINT "fixture_events_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixture_events" ADD CONSTRAINT "fixture_events_assist_player_id_players_id_fk" FOREIGN KEY ("assist_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixture_lineups" ADD CONSTRAINT "fixture_lineups_fixture_id_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixture_lineups" ADD CONSTRAINT "fixture_lineups_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixture_lineups" ADD CONSTRAINT "fixture_lineups_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixture_player_stats" ADD CONSTRAINT "fixture_player_stats_fixture_id_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixture_player_stats" ADD CONSTRAINT "fixture_player_stats_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixture_player_stats" ADD CONSTRAINT "fixture_player_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixture_statistics" ADD CONSTRAINT "fixture_statistics_fixture_id_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixture_statistics" ADD CONSTRAINT "fixture_statistics_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "injuries" ADD CONSTRAINT "injuries_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "injuries" ADD CONSTRAINT "injuries_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "injuries" ADD CONSTRAINT "injuries_fixture_id_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats" ADD CONSTRAINT "player_season_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats" ADD CONSTRAINT "player_season_stats_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_season_stats" ADD CONSTRAINT "player_season_stats_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_current_team_id_teams_id_fk" FOREIGN KEY ("current_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_fixture_id_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_winner_id_teams_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standings" ADD CONSTRAINT "standings_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standings" ADD CONSTRAINT "standings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_country_code_countries_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_team_id_teams_id_fk" FOREIGN KEY ("from_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_team_id_teams_id_fk" FOREIGN KEY ("to_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "competitions_country_code_idx" ON "competitions" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "competitions_is_women_idx" ON "competitions" USING btree ("is_women");--> statement-breakpoint
CREATE INDEX "fixture_events_fixture_minute_idx" ON "fixture_events" USING btree ("fixture_id","minute");--> statement-breakpoint
CREATE INDEX "fixture_player_stats_player_id_idx" ON "fixture_player_stats" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "fixtures_kickoff_at_idx" ON "fixtures" USING btree ("kickoff_at");--> statement-breakpoint
CREATE INDEX "fixtures_live_status_idx" ON "fixtures" USING btree ("status_code") WHERE status_code IN ('1H','HT','2H','ET','BT','P','LIVE');--> statement-breakpoint
CREATE INDEX "fixtures_competition_season_round_idx" ON "fixtures" USING btree ("competition_id","season_year","round_number");--> statement-breakpoint
CREATE INDEX "fixtures_home_team_id_idx" ON "fixtures" USING btree ("home_team_id");--> statement-breakpoint
CREATE INDEX "fixtures_away_team_id_idx" ON "fixtures" USING btree ("away_team_id");--> statement-breakpoint
CREATE INDEX "media_videos_competition_ids_idx" ON "media_videos" USING gin ("competition_ids");--> statement-breakpoint
CREATE INDEX "media_videos_team_ids_idx" ON "media_videos" USING gin ("team_ids");--> statement-breakpoint
CREATE INDEX "media_videos_fixture_ids_idx" ON "media_videos" USING gin ("fixture_ids");--> statement-breakpoint
CREATE INDEX "media_videos_player_ids_idx" ON "media_videos" USING gin ("player_ids");--> statement-breakpoint
CREATE INDEX "media_videos_category_published_idx" ON "media_videos" USING btree ("category","published_at") WHERE is_archived = false;--> statement-breakpoint
CREATE INDEX "player_season_stats_competition_season_idx" ON "player_season_stats" USING btree ("competition_id","season_year");--> statement-breakpoint
CREATE INDEX "players_current_team_id_idx" ON "players" USING btree ("current_team_id");--> statement-breakpoint
CREATE INDEX "players_is_women_idx" ON "players" USING btree ("is_women");--> statement-breakpoint
CREATE INDEX "standings_competition_season_group_rank_idx" ON "standings" USING btree ("competition_id","season_year","group_label","rank");--> statement-breakpoint
CREATE INDEX "teams_country_code_idx" ON "teams" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "teams_is_women_idx" ON "teams" USING btree ("is_women");