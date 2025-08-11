-- DropForeignKey
ALTER TABLE "public"."draft_picks" DROP CONSTRAINT "draft_picks_season_year_fkey";

-- DropForeignKey
ALTER TABLE "public"."matchups" DROP CONSTRAINT "matchups_season_year_fkey";

-- DropForeignKey
ALTER TABLE "public"."teams" DROP CONSTRAINT "teams_season_year_fkey";

-- CreateTable
CREATE TABLE "public"."team_season_stats" (
    "id" SERIAL NOT NULL,
    "season_year" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "ties" INTEGER NOT NULL,
    "points_for" DOUBLE PRECISION NOT NULL,
    "points_against" DOUBLE PRECISION NOT NULL,
    "actual_rank" INTEGER NOT NULL,
    "power_rank" INTEGER NOT NULL,
    "median_rank" INTEGER NOT NULL,
    "combined_rank" INTEGER NOT NULL,

    CONSTRAINT "team_season_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."league_records" (
    "id" SERIAL NOT NULL,
    "season_year" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "record_type" TEXT NOT NULL,
    "team_id" INTEGER,
    "matchup_id" INTEGER,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "league_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_season_stats_team_id_key" ON "public"."team_season_stats"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_season_stats_season_year_team_id_key" ON "public"."team_season_stats"("season_year", "team_id");

-- CreateIndex
CREATE INDEX "league_records_season_year_record_type_idx" ON "public"."league_records"("season_year", "record_type");

-- AddForeignKey
ALTER TABLE "public"."teams" ADD CONSTRAINT "teams_season_year_fkey" FOREIGN KEY ("season_year") REFERENCES "public"."seasons"("year") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matchups" ADD CONSTRAINT "matchups_season_year_fkey" FOREIGN KEY ("season_year") REFERENCES "public"."seasons"("year") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."draft_picks" ADD CONSTRAINT "draft_picks_season_year_fkey" FOREIGN KEY ("season_year") REFERENCES "public"."seasons"("year") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_season_stats" ADD CONSTRAINT "team_season_stats_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
