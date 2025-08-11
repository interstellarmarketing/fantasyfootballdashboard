const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAnalytics() {
  try {
    const stats = await prisma.teamSeasonStats.findMany({
      where: { season_year: 2024 },
      include: { team: true },
      take: 3
    });

    console.log('First 3 teams in 2024:');
    stats.forEach(stat => {
      console.log(`${stat.team.team_name}:`);
      console.log(`  Power: ${stat.power_wins}-${stat.power_losses}-${stat.power_ties}`);
      console.log(`  Median: ${stat.median_wins}-${stat.median_losses}-${stat.median_ties}`);
      console.log(`  Combined: ${stat.combined_wins}-${stat.combined_losses}-${stat.combined_ties}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAnalytics(); 