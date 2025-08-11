const { exec } = require('child_process');

exec('curl http://localhost:3000/api/seasons/2024/standings', (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  try {
    const data = JSON.parse(stdout);
    console.log('First team data:');
    console.log('Team name:', data[0].team.team_name);
    console.log('Power wins:', data[0].power_wins);
    console.log('Power losses:', data[0].power_losses);
    console.log('Power ties:', data[0].power_ties);
    console.log('Median wins:', data[0].median_wins);
    console.log('Combined wins:', data[0].combined_wins);
    
    console.log('\nAll available fields:');
    console.log(Object.keys(data[0]));
  } catch (parseError) {
    console.error('Parse error:', parseError);
    console.log('Raw output:', stdout);
  }
}); 