import { PrismaClient } from '@prisma/client';
import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const prisma = new PrismaClient();

async function main() {
  const db = await open({
    filename: '../fantasy_league.db',
    driver: sqlite3.Database,
  });

  console.log('--- Starting Data Migration ---');

  console.log('\nStep 1: Clearing existing data from Neon database...');
  // Correct order for deletion (child tables first)
  await prisma.draftPick.deleteMany({});
  await prisma.boxScorePlayer.deleteMany({});
  await prisma.matchup.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.player.deleteMany({});
  console.log('All tables cleared.');

  console.log('\nStep 2: Migrating seasons...');
  const seasons = await db.all('SELECT * FROM seasons');
  await prisma.season.createMany({ data: seasons.map(s => ({...s, is_legacy: Boolean(s.is_legacy)})) });
  console.log(`Successfully migrated ${seasons.length} seasons.`);

  console.log('\nStep 3: Migrating players...');
  const players = await db.all('SELECT * FROM players');
  const playerIds = new Set(players.map(p => p.id));
  await prisma.player.createMany({ data: players });
  console.log(`Found ${players.length} unique players in source data.`);
  console.log(`Successfully migrated ${players.length} players.`);


  console.log('\nStep 4: Migrating teams...');
  const teams = await db.all('SELECT * FROM teams');
  await prisma.team.createMany({ data: teams });
  console.log(`Successfully migrated ${teams.length} teams.`);

  console.log('\nStep 5: Migrating matchups...');
  const matchups = await db.all('SELECT * FROM matchups');
  const matchupsToCreate = matchups.map(m => ({ ...m, is_playoff: Boolean(m.is_playoff) }));
  await prisma.matchup.createMany({ data: matchupsToCreate });
  console.log(`Successfully migrated ${matchups.length} matchups.`);


  console.log('\nStep 6: Migrating box scores...');
  const boxScorePlayers = await db.all('SELECT * FROM box_score_players');
  const validBoxScores = [];
  let skippedBoxScores = 0;
  for (const bsp of boxScorePlayers) {
    if (playerIds.has(bsp.player_id)) {
      validBoxScores.push(bsp);
    } else {
      skippedBoxScores++;
      // console.warn(`Skipping box score for player_id ${bsp.player_id} as the player does not exist.`);
    }
  }
  await prisma.boxScorePlayer.createMany({ data: validBoxScores });
  console.log(`Successfully migrated ${validBoxScores.length} box scores.`);
  console.log(`Skipped ${skippedBoxScores} orphaned box scores.`);


  console.log('\nStep 7: Migrating draft picks...');
  const draftPicks = await db.all('SELECT * FROM draft_picks');
  const validDraftPicks = [];
  let skippedDraftPicks = 0;
  for (const dp of draftPicks) {
    if (playerIds.has(dp.player_id)) {
      validDraftPicks.push(dp);
    } else {
      skippedDraftPicks++;
      // console.warn(`Skipping draft pick for player_id ${dp.player_id} as the player does not exist.`);
    }
  }
  await prisma.draftPick.createMany({ data: validDraftPicks });
  console.log(`Successfully migrated ${validDraftPicks.length} draft picks.`);
  console.log(`Skipped ${skippedDraftPicks} orphaned draft picks.`);


  console.log('\n--- Data Migration Complete! ---');
}

main()
  .catch((e) => {
    console.error('\n--- An error occurred during migration ---');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
