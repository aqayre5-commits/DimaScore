CREATE TABLE "player_trophies" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"player_id" bigint NOT NULL,
	"league" text NOT NULL,
	"country" text,
	"season" text,
	"place" text
);
--> statement-breakpoint
CREATE TABLE "team_season_stats" (
	"team_id" bigint NOT NULL,
	"competition_id" bigint NOT NULL,
	"season_year" integer NOT NULL,
	"stats" jsonb NOT NULL,
	CONSTRAINT "team_season_stats_team_id_competition_id_season_year_pk" PRIMARY KEY("team_id","competition_id","season_year")
);
--> statement-breakpoint
ALTER TABLE "fixture_events" ALTER COLUMN "minute" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "fixtures" ADD COLUMN "is_featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "fixtures" ADD COLUMN "details_synced_at" timestamp with time zone DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "player_trophies" ADD CONSTRAINT "player_trophies_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_season_stats" ADD CONSTRAINT "team_season_stats_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_season_stats" ADD CONSTRAINT "team_season_stats_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "player_trophies_player_id_idx" ON "player_trophies" USING btree ("player_id");