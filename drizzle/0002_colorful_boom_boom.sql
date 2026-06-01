CREATE TABLE "squad_members" (
	"team_id" bigint NOT NULL,
	"player_id" bigint NOT NULL,
	CONSTRAINT "squad_members_team_id_player_id_pk" PRIMARY KEY("team_id","player_id")
);
--> statement-breakpoint
ALTER TABLE "squad_members" ADD CONSTRAINT "squad_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "squad_members" ADD CONSTRAINT "squad_members_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "squad_members_team_id_idx" ON "squad_members" USING btree ("team_id");--> statement-breakpoint
ALTER TABLE "league_coverage" ADD CONSTRAINT "league_coverage_league_id_competitions_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."competitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coaches_current_team_id_idx" ON "coaches" USING btree ("current_team_id");--> statement-breakpoint
CREATE INDEX "injuries_fixture_id_idx" ON "injuries" USING btree ("fixture_id");--> statement-breakpoint
CREATE INDEX "injuries_player_id_idx" ON "injuries" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "transfers_player_id_idx" ON "transfers" USING btree ("player_id");