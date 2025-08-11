-- DropForeignKey
ALTER TABLE "public"."matchups" DROP CONSTRAINT "matchups_away_team_id_fkey";

-- AlterTable
ALTER TABLE "public"."matchups" ADD COLUMN     "is_bye" BOOLEAN DEFAULT false,
ALTER COLUMN "away_team_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."matchups" ADD CONSTRAINT "matchups_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
