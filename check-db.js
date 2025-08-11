const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database contents...\n');
    
    // Check TeamSeasonStats
    const stats = await prisma.teamSeasonStats.findMany({ take: 5 });
    console.log(`TeamSeasonStats records: ${stats.length}`);
    if (stats.length > 0) {
      console.log('Sample TeamSeasonStats record:');
      console.log(JSON.stringify(stats[0], null, 2));
    }
    
    // Check Teams
    const teams = await prisma.team.findMany({ 
      where: { season_year: 2024 }, 
      take: 3 
    });
    console.log(`\nTeams in 2024: ${teams.length}`);
    if (teams.length > 0) {
      console.log('Sample team:');
      console.log(JSON.stringify(teams[0], null, 2));
    }
    
    // Check Matchups
    const matchups = await prisma.matchup.findMany({ 
      where: { season_year: 2024 }, 
      take: 3 
    });
    console.log(`\nMatchups in 2024: ${matchups.length}`);
    if (matchups.length > 0) {
      console.log('Sample matchup:');
      console.log(JSON.stringify(matchups[0], null, 2));
    }
    
    // Check BoxScorePlayers
    const boxScores = await prisma.boxScorePlayer.findMany({ 
      take: 3 
    });
    console.log(`\nBoxScorePlayer records: ${boxScores.length}`);
    if (boxScores.length > 0) {
      console.log('Sample BoxScorePlayer:');
      console.log(JSON.stringify(boxScores[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 