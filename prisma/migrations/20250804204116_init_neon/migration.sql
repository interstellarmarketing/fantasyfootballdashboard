-- CreateTable
CREATE TABLE "public"."seasons" (
    "year" INTEGER NOT NULL,
    "league_name" TEXT NOT NULL,
    "regular_season_weeks" INTEGER NOT NULL,
    "is_legacy" BOOLEAN NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "public"."teams" (
    "id" SERIAL NOT NULL,
    "season_year" INTEGER NOT NULL,
    "espn_team_id" INTEGER NOT NULL,
    "team_name" TEXT NOT NULL,
    "owner_name" TEXT,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "ties" INTEGER NOT NULL,
    "points_for" DOUBLE PRECISION NOT NULL,
    "points_against" DOUBLE PRECISION NOT NULL,
    "final_standing" INTEGER NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."players" (
    "id" INTEGER NOT NULL,
    "full_name" TEXT NOT NULL,
    "position" TEXT,
    "pro_team" TEXT,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."matchups" (
    "id" SERIAL NOT NULL,
    "season_year" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "home_team_id" INTEGER NOT NULL,
    "away_team_id" INTEGER NOT NULL,
    "home_score" DOUBLE PRECISION NOT NULL,
    "away_score" DOUBLE PRECISION NOT NULL,
    "is_playoff" BOOLEAN NOT NULL,

    CONSTRAINT "matchups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."box_score_players" (
    "id" SERIAL NOT NULL,
    "matchup_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "slot_position" TEXT NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "projected_points" DOUBLE PRECISION,

    CONSTRAINT "box_score_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."draft_picks" (
    "id" SERIAL NOT NULL,
    "season_year" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "round_num" INTEGER NOT NULL,
    "round_pick" INTEGER NOT NULL,
    "bid_amount" INTEGER,

    CONSTRAINT "draft_picks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teams_season_year_idx" ON "public"."teams"("season_year");

-- CreateIndex
CREATE INDEX "teams_espn_team_id_idx" ON "public"."teams"("espn_team_id");

-- CreateIndex
CREATE INDEX "players_full_name_idx" ON "public"."players"("full_name");

-- CreateIndex
CREATE INDEX "matchups_season_year_idx" ON "public"."matchups"("season_year");

-- CreateIndex
CREATE INDEX "matchups_week_idx" ON "public"."matchups"("week");

-- CreateIndex
CREATE INDEX "box_score_players_matchup_id_idx" ON "public"."box_score_players"("matchup_id");

-- CreateIndex
CREATE INDEX "box_score_players_team_id_idx" ON "public"."box_score_players"("team_id");

-- CreateIndex
CREATE INDEX "box_score_players_player_id_idx" ON "public"."box_score_players"("player_id");

-- CreateIndex
CREATE INDEX "draft_picks_season_year_idx" ON "public"."draft_picks"("season_year");

-- CreateIndex
CREATE INDEX "draft_picks_team_id_idx" ON "public"."draft_picks"("team_id");

-- CreateIndex
CREATE INDEX "draft_picks_player_id_idx" ON "public"."draft_picks"("player_id");

-- AddForeignKey
ALTER TABLE "public"."teams" ADD CONSTRAINT "teams_season_year_fkey" FOREIGN KEY ("season_year") REFERENCES "public"."seasons"("year") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matchups" ADD CONSTRAINT "matchups_season_year_fkey" FOREIGN KEY ("season_year") REFERENCES "public"."seasons"("year") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matchups" ADD CONSTRAINT "matchups_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matchups" ADD CONSTRAINT "matchups_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."box_score_players" ADD CONSTRAINT "box_score_players_matchup_id_fkey" FOREIGN KEY ("matchup_id") REFERENCES "public"."matchups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."box_score_players" ADD CONSTRAINT "box_score_players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."box_score_players" ADD CONSTRAINT "box_score_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."draft_picks" ADD CONSTRAINT "draft_picks_season_year_fkey" FOREIGN KEY ("season_year") REFERENCES "public"."seasons"("year") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."draft_picks" ADD CONSTRAINT "draft_picks_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."draft_picks" ADD CONSTRAINT "draft_picks_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
