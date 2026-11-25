ALTER TABLE "teams" ADD COLUMN "national_category" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "age_group" integer;--> statement-breakpoint
CREATE INDEX "teams_national_family_idx" ON "teams" USING btree ("country_code","national_category","age_group");
