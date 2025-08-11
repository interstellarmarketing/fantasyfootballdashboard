-- AlterTable
ALTER TABLE "public"."teams" ADD COLUMN     "points_against" DOUBLE PRECISION DEFAULT 0;

-- CreateIndex
CREATE INDEX "matchups_season_year_is_playoff_idx" ON "public"."matchups"("season_year", "is_playoff");

-- CreateIndex
CREATE INDEX "matchups_home_team_id_idx" ON "public"."matchups"("home_team_id");

-- CreateIndex
CREATE INDEX "matchups_away_team_id_idx" ON "public"."matchups"("away_team_id");

-- CreateIndex
CREATE INDEX "teams_espn_team_id_season_year_idx" ON "public"."teams"("espn_team_id", "season_year");
