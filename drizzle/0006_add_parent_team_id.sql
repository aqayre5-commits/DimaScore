ALTER TABLE "teams" ADD COLUMN "parent_team_id" bigint;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_parent_team_id_teams_id_fk" FOREIGN KEY ("parent_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "teams_parent_team_id_idx" ON "teams" USING btree ("parent_team_id");