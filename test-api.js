const fetch = require('node-fetch');

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/seasons/2024/standings');
    const data = await response.json();
    
    console.log('API Response for first team:');
    const firstTeam = data[0];
    console.log(`Team: ${firstTeam.team.team_name}`);
    console.log(`Power: ${firstTeam.power_wins}-${firstTeam.power_losses}-${firstTeam.power_ties}`);
    console.log(`Median: ${firstTeam.median_wins}-${firstTeam.median_losses}-${firstTeam.median_ties}`);
    console.log(`Combined: ${firstTeam.combined_wins}-${firstTeam.combined_losses}-${firstTeam.combined_ties}`);
    
    console.log('\nAll fields available:');
    console.log(Object.keys(firstTeam));
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI(); 