-- CreateTable
CREATE TABLE "public"."transactions" (
    "id" SERIAL NOT NULL,
    "season_year" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "team_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transactions_season_year_idx" ON "public"."transactions"("season_year");

-- CreateIndex
CREATE INDEX "transactions_team_id_idx" ON "public"."transactions"("team_id");

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_season_year_fkey" FOREIGN KEY ("season_year") REFERENCES "public"."seasons"("year") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
