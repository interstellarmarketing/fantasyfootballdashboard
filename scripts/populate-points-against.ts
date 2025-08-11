import { PrismaClient } from '@prisma/client';
import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const prisma = new PrismaClient();

async function main() {
  const db = await open({
    filename: '../dashboard/instance/fantasy_league.db',
    driver: sqlite3.Database,
  });

  console.log('--- Populating Points Against Data ---');

  // Get all teams from the SQLite database with points_against
  const teamsWithPointsAgainst = await db.all('SELECT * FROM teams');
  
  console.log(`Found ${teamsWithPointsAgainst.length} teams to update.`);

  // Update each team with their points_against data
  for (const team of teamsWithPointsAgainst) {
    await prisma.team.updateMany({
      where: {
        season_year: team.season_year,
        espn_team_id: team.espn_team_id
      },
      data: {
        points_against: team.points_against || 0
      }
    });
  }

  console.log('Successfully updated points_against for all teams.');
  console.log('--- Points Against Population Complete! ---');
}

main()
  .catch((e) => {
    console.error('\n--- An error occurred during population ---');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 