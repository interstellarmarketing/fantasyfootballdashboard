import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database cleanup...');

  // The order of deletion is important to avoid foreign key constraint violations.
  // We delete from tables that have foreign keys first, and then the tables they refer to.

  console.log('Deleting LeagueRecord records...');
  await prisma.leagueRecord.deleteMany({});

  console.log('Deleting TeamSeasonStats records...');
  await prisma.teamSeasonStats.deleteMany({});

  console.log('Deleting BoxScorePlayer records...');
  await prisma.boxScorePlayer.deleteMany({});

  console.log('Deleting DraftPick records...');
  await prisma.draftPick.deleteMany({});

  // Now that BoxScorePlayer is deleted, we can delete Matchup.
  console.log('Deleting Matchup records...');
  await prisma.matchup.deleteMany({});

  // Now that tables with foreign keys to Team are cleared, we can delete Team.
  console.log('Deleting Team records...');
  await prisma.team.deleteMany({});

  // Now that tables with foreign keys to Player are cleared, we can delete Player.
  console.log('Deleting Player records...');
  await prisma.player.deleteMany({});

  // Finally, with all dependent data gone, we can delete Season records.
  console.log('Deleting Season records...');
  await prisma.season.deleteMany({});

  console.log('Database cleanup complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
