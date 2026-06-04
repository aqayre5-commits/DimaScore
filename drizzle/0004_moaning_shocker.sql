CREATE TABLE "tournament_squads" (
	"competition_id" bigint NOT NULL,
	"season_year" integer NOT NULL,
	"team_id" bigint NOT NULL,
	"player_id" bigint NOT NULL,
	CONSTRAINT "tournament_squads_competition_id_season_year_team_id_player_id_pk" PRIMARY KEY("competition_id","season_year","team_id","player_id")
);
--> statement-breakpoint
ALTER TABLE "tournament_squads" ADD CONSTRAINT "tournament_squads_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_squads" ADD CONSTRAINT "tournament_squads_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_squads" ADD CONSTRAINT "tournament_squads_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tournament_squads_team_idx" ON "tournament_squads" USING btree ("team_id","competition_id","season_year");