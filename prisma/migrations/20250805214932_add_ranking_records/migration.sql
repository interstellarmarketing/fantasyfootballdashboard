/*
  Warnings:

  - Made the column `combined_losses` on table `team_season_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `combined_ties` on table `team_season_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `combined_wins` on table `team_season_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `median_losses` on table `team_season_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `median_ties` on table `team_season_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `median_wins` on table `team_season_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `power_losses` on table `team_season_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `power_ties` on table `team_season_stats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `power_wins` on table `team_season_stats` required. This step will fail if there are existing NULL values in that column.

*/

-- First, update existing records to have default values
UPDATE "public"."team_season_stats" SET 
  "power_wins" = 0,
  "power_losses" = 0,
  "power_ties" = 0,
  "median_wins" = 0,
  "median_losses" = 0,
  "median_ties" = 0,
  "combined_wins" = 0,
  "combined_losses" = 0,
  "combined_ties" = 0
WHERE "power_wins" IS NULL;

-- AlterTable
ALTER TABLE "public"."team_season_stats" ALTER COLUMN "combined_losses" SET NOT NULL,
ALTER COLUMN "combined_losses" SET DEFAULT 0,
ALTER COLUMN "combined_ties" SET NOT NULL,
ALTER COLUMN "combined_ties" SET DEFAULT 0,
ALTER COLUMN "combined_wins" SET NOT NULL,
ALTER COLUMN "combined_wins" SET DEFAULT 0,
ALTER COLUMN "median_losses" SET NOT NULL,
ALTER COLUMN "median_losses" SET DEFAULT 0,
ALTER COLUMN "median_ties" SET NOT NULL,
ALTER COLUMN "median_ties" SET DEFAULT 0,
ALTER COLUMN "median_wins" SET NOT NULL,
ALTER COLUMN "median_wins" SET DEFAULT 0,
ALTER COLUMN "power_losses" SET NOT NULL,
ALTER COLUMN "power_losses" SET DEFAULT 0,
ALTER COLUMN "power_ties" SET NOT NULL,
ALTER COLUMN "power_ties" SET DEFAULT 0,
ALTER COLUMN "power_wins" SET NOT NULL,
ALTER COLUMN "power_wins" SET DEFAULT 0;
