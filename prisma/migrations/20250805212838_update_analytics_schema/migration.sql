-- AlterTable
ALTER TABLE "public"."team_season_stats" ADD COLUMN     "combined_losses" INTEGER,
ADD COLUMN     "combined_ties" INTEGER,
ADD COLUMN     "combined_wins" INTEGER,
ADD COLUMN     "median_losses" INTEGER,
ADD COLUMN     "median_ties" INTEGER,
ADD COLUMN     "median_wins" INTEGER,
ADD COLUMN     "power_losses" INTEGER,
ADD COLUMN     "power_ties" INTEGER,
ADD COLUMN     "power_wins" INTEGER;
