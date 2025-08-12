// scripts/calculate-analytics.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TeamAnalytics {
  team_id: number;
  wins: number;
  losses: number;
  ties: number;
  points_for: number;
  points_against: number;
  power_wins: number;
  power_losses: number;
  power_ties: number;
  median_wins: number;
  median_losses: number;
  median_ties: number;
  combined_wins: number;
  combined_losses: number;
  combined_ties: number;
}

async function main() {
  console.log('Starting analytics calculation...');

  const seasons = await prisma.season.findMany();

  for (const season of seasons) {
    console.log(`Processing season: ${season.year}`);

    // Clear old analytics data for the season
    await prisma.teamSeasonStats.deleteMany({ where: { season_year: season.year } });
    await prisma.leagueRecord.deleteMany({ where: { season_year: season.year } });

    // --- 1. Calculate TeamSeasonStats (Standings, Ranks, etc.) ---
    const teams = await prisma.team.findMany({ where: { season_year: season.year } });
    const allMatchups = await prisma.matchup.findMany({ 
      where: { 
        season_year: season.year,
        week: { lte: 17 } // Only include weeks 1-17
      },
      orderBy: { week: 'asc' }
    });
    
    // Calculate analytics for each team
    const teamAnalytics: TeamAnalytics[] = [];
    
    // Get matchup info to map team_id/matchup_id to week
    const matchups = await prisma.matchup.findMany({
      where: {
        season_year: season.year,
        week: { lte: 17 }
      },
      select: {
        id: true,
        week: true,
        home_team_id: true,
        away_team_id: true
      }
    });
    
    const uniqueWeeks = [...new Set(matchups.map(m => m.week))];
    
    // Use matchup scores directly for all seasons (simpler and more reliable)
    console.log(`\nSeason ${season.year} - Using matchup scores`);
    
    // Get all matchups with scores
    const matchupsWithScores = await prisma.matchup.findMany({
      where: {
        season_year: season.year,
        week: { lte: 17 }
      },
      select: {
        week: true,
        home_team_id: true,
        away_team_id: true,
        home_score: true,
        away_score: true
      }
    });
    
    console.log(`Total matchups with scores: ${matchupsWithScores.length}`);
    
    // Build team scores by week from matchup data
    const teamScoresByWeek: { [teamId: number]: { [week: number]: number } } = {};
    
    for (const matchup of matchupsWithScores) {
      if (!teamScoresByWeek[matchup.home_team_id]) {
        teamScoresByWeek[matchup.home_team_id] = {};
      }
      if (!teamScoresByWeek[matchup.away_team_id]) {
        teamScoresByWeek[matchup.away_team_id] = {};
      }
      
      teamScoresByWeek[matchup.home_team_id][matchup.week] = matchup.home_score;
      teamScoresByWeek[matchup.away_team_id][matchup.week] = matchup.away_score;
    }
    
    // Debug: Check how many teams have data for each week
    const weekTeamCount: { [week: number]: number } = {};
    for (const matchup of matchupsWithScores) {
      weekTeamCount[matchup.week] = (weekTeamCount[matchup.week] || 0) + 2; // 2 teams per matchup
    }
    console.log(`Teams per week:`, weekTeamCount);
    
    // Debug: Check which teams have data for each week
    console.log(`\nTeam data by week for ${season.year}:`);
    for (const team of teams) {
      const teamWeeks = Object.keys(teamScoresByWeek[team.id] || {}).map(Number).sort((a, b) => a - b);
      const missingWeeks = uniqueWeeks.filter(w => !teamWeeks.includes(w));
      console.log(`${team.team_name}: Weeks ${teamWeeks.join(', ')} | Missing: ${missingWeeks.join(', ')}`);
    }
    
    for (const team of teams) {
      const teamMatchups = allMatchups.filter(m => 
        m.home_team_id === team.id || m.away_team_id === team.id
      );
      
      // Calculate median scores for each week
      const weeklyMedians: { [week: number]: number } = {};
      
      for (const week of uniqueWeeks) {
        const weekScores: number[] = [];
        for (const teamId in teamScoresByWeek) {
          if (teamScoresByWeek[teamId][week]) {
            weekScores.push(teamScoresByWeek[teamId][week]);
          }
        }
        if (weekScores.length > 0) {
          weekScores.sort((a, b) => a - b);
          const mid = Math.floor(weekScores.length / 2);
          weeklyMedians[week] = weekScores.length % 2 === 0 
            ? (weekScores[mid - 1] + weekScores[mid]) / 2 
            : weekScores[mid];
        }
      }
      
      // Initialize analytics
      let powerWins = 0;
      let powerLosses = 0;
      let medianWins = 0;
      let medianLosses = 0;
      let medianTies = 0;
      
      // Calculate power rankings (if every team played every other team every week)
      const otherTeams = teams.filter(t => t.id !== team.id);
      
      // Debug for first team
      if (team.id === teams[0].id) {
        console.log(`\nDebugging power rankings for ${team.team_name}:`);
        console.log(`Total weeks: ${uniqueWeeks.length}`);
        console.log(`Other teams: ${otherTeams.length}`);
        console.log(`Expected games: ${uniqueWeeks.length * otherTeams.length}`);
        
        // Debug which weeks the team has scores for
        const teamWeeks = Object.keys(teamScoresByWeek[team.id] || {}).map(Number).sort((a, b) => a - b);
        console.log(`Weeks with scores: ${teamWeeks.join(', ')}`);
        console.log(`Missing weeks: ${uniqueWeeks.filter(w => !teamWeeks.includes(w)).join(', ')}`);
      }
      
      // Debug for Welfare Warriors specifically
      if (team.team_name === 'Welfare Warriors') {
        console.log(`\nDebugging power rankings for ${team.team_name}:`);
        console.log(`Total weeks: ${uniqueWeeks.length}`);
        console.log(`Other teams: ${otherTeams.length}`);
        console.log(`Expected games: ${uniqueWeeks.length * otherTeams.length}`);
        
        // Debug which weeks the team has scores for
        const teamWeeks = Object.keys(teamScoresByWeek[team.id] || {}).map(Number).sort((a, b) => a - b);
        console.log(`Weeks with scores: ${teamWeeks.join(', ')}`);
        console.log(`Missing weeks: ${uniqueWeeks.filter(w => !teamWeeks.includes(w)).join(', ')}`);
      }
      
      for (const week of uniqueWeeks) {
        // Get the team's score for this week
        let teamScore = teamScoresByWeek[team.id]?.[week];
        
        // If team doesn't have a score for this week (bye week), use their average score
        if (teamScore === undefined) {
          const teamWeeks = Object.keys(teamScoresByWeek[team.id] || {}).map(Number);
          if (teamWeeks.length > 0) {
            const totalScore = teamWeeks.reduce((sum, w) => sum + (teamScoresByWeek[team.id][w] || 0), 0);
            teamScore = totalScore / teamWeeks.length;
          } else {
            teamScore = 0; // Default if no scores available
          }
        }
        
        if (teamScore !== undefined) {
          // Simulate playing against every other team this week
          for (const otherTeam of otherTeams) {
            let otherTeamScore = teamScoresByWeek[otherTeam.id]?.[week];
            
            // If other team doesn't have a score for this week (bye week), use their average score
            if (otherTeamScore === undefined) {
              const otherTeamWeeks = Object.keys(teamScoresByWeek[otherTeam.id] || {}).map(Number);
              if (otherTeamWeeks.length > 0) {
                const totalScore = otherTeamWeeks.reduce((sum, w) => sum + (teamScoresByWeek[otherTeam.id][w] || 0), 0);
                otherTeamScore = totalScore / otherTeamWeeks.length;
              } else {
                otherTeamScore = 0; // Default if no scores available
              }
            }
            
            if (otherTeamScore !== undefined) {
              if (teamScore > otherTeamScore) {
                powerWins++;
              } else if (teamScore < otherTeamScore) {
                powerLosses++;
              }
            }
          }
        }
      }
      
      // Debug for first team - show detailed breakdown
      if (team.id === teams[0].id) {
        console.log(`\nDetailed breakdown for ${team.team_name}:`);
        console.log(`Team score by week:`, teamScoresByWeek[team.id]);
        
        let totalComparisons = 0;
        let validComparisons = 0;
        
        for (const week of uniqueWeeks) {
          const teamScore = teamScoresByWeek[team.id]?.[week];
          if (teamScore !== undefined) {
            for (const otherTeam of otherTeams) {
              totalComparisons++;
              const otherTeamScore = teamScoresByWeek[otherTeam.id]?.[week];
              if (otherTeamScore !== undefined) {
                validComparisons++;
              }
            }
          }
        }
        
        console.log(`Total possible comparisons: ${totalComparisons}`);
        console.log(`Valid comparisons (both teams have scores): ${validComparisons}`);
        console.log(`Missing comparisons: ${totalComparisons - validComparisons}`);
      }
      
      // Debug for first team
      if (team.id === teams[0].id) {
        console.log(`Actual games counted: ${powerWins + powerLosses}`);
        console.log(`Power record: ${powerWins}-${powerLosses}-0`);
      }
      
      // Debug for Welfare Warriors specifically
      if (team.team_name === 'Welfare Warriors') {
        console.log(`Actual games counted: ${powerWins + powerLosses}`);
        console.log(`Power record: ${powerWins}-${powerLosses}-0`);
        
        console.log(`\nDetailed breakdown for ${team.team_name}:`);
        console.log(`Team score by week:`, teamScoresByWeek[team.id]);
        
        let totalComparisons = 0;
        let validComparisons = 0;
        
        for (const week of uniqueWeeks) {
          const teamScore = teamScoresByWeek[team.id]?.[week];
          if (teamScore !== undefined) {
            for (const otherTeam of otherTeams) {
              totalComparisons++;
              const otherTeamScore = teamScoresByWeek[otherTeam.id]?.[week];
              if (otherTeamScore !== undefined) {
                validComparisons++;
              }
            }
          }
        }
        
        console.log(`Total possible comparisons: ${totalComparisons}`);
        console.log(`Valid comparisons (both teams have scores): ${validComparisons}`);
        console.log(`Missing comparisons: ${totalComparisons - validComparisons}`);
      }
      
      // Calculate median rankings (win/loss against median score each week)
      for (const week of uniqueWeeks) {
        const teamScore = teamScoresByWeek[team.id]?.[week];
        const medianScore = weeklyMedians[week];
        
        if (teamScore !== undefined && medianScore !== undefined) {
          if (teamScore > medianScore) {
            medianWins++;
          } else if (teamScore < medianScore) {
            medianLosses++;
          } else {
            medianTies++;
          }
        }
      }
      
      // Calculate combined rankings (actual wins + median wins)
      const combinedWins = team.wins + medianWins;
      const combinedLosses = team.losses + medianLosses;
      const combinedTies = team.ties + medianTies;
      
      teamAnalytics.push({
        team_id: team.id,
        wins: team.wins,
        losses: team.losses,
        ties: team.ties,
        points_for: team.points_for,
        points_against: team.points_against ?? 0,
        power_wins: powerWins,
        power_losses: powerLosses,
        power_ties: 0, // Power rankings don't have ties since we're comparing scores
        median_wins: medianWins,
        median_losses: medianLosses,
        median_ties: medianTies,
        combined_wins: combinedWins,
        combined_losses: combinedLosses,
        combined_ties: combinedTies,
      });
    }
    
    // Calculate ranks for each category (actual rank will use final_standing with record-based fallback)
    const sortedByRecord = [...teamAnalytics].sort((a, b) => {
      const aWinPct = a.wins / (a.wins + a.losses + a.ties);
      const bWinPct = b.wins / (b.wins + b.losses + b.ties);
      if (aWinPct !== bWinPct) return bWinPct - aWinPct;
      return b.points_for - a.points_for;
    });
    const sortedByPower = [...teamAnalytics].sort((a, b) => {
      const aWinPct = a.power_wins / (a.power_wins + a.power_losses);
      const bWinPct = b.power_wins / (b.power_wins + b.power_losses);
      if (aWinPct !== bWinPct) return bWinPct - aWinPct;
      return b.points_for - a.points_for;
    });
    
    const sortedByMedian = [...teamAnalytics].sort((a, b) => {
      const aWinPct = a.median_wins / (a.median_wins + a.median_losses + a.median_ties);
      const bWinPct = b.median_wins / (b.median_wins + b.median_losses + b.median_ties);
      if (aWinPct !== bWinPct) return bWinPct - aWinPct;
      return b.points_for - a.points_for;
    });
    
    const sortedByCombined = [...teamAnalytics].sort((a, b) => {
      const aWinPct = a.combined_wins / (a.combined_wins + a.combined_losses + a.combined_ties);
      const bWinPct = b.combined_wins / (b.combined_wins + b.combined_losses + b.combined_ties);
      if (aWinPct !== bWinPct) return bWinPct - aWinPct;
      return b.points_for - a.points_for;
    });
    
    // Create TeamSeasonStats records with proper ranks
    for (const team of teams) {
      const analytics = teamAnalytics.find(t => t.team_id === team.id);
      if (!analytics) continue;
      
      const actualRank = team.final_standing && team.final_standing > 0
        ? team.final_standing
        : (sortedByRecord.findIndex(t => t.team_id === team.id) + 1);
      const powerRank = sortedByPower.findIndex(t => t.team_id === team.id) + 1;
      const medianRank = sortedByMedian.findIndex(t => t.team_id === team.id) + 1;
      const combinedRank = sortedByCombined.findIndex(t => t.team_id === team.id) + 1;
      
      await prisma.teamSeasonStats.create({
        data: {
          season_year: season.year,
          team_id: team.id,
          wins: analytics.wins,
          losses: analytics.losses,
          ties: analytics.ties,
          points_for: analytics.points_for,
          points_against: analytics.points_against,
          actual_rank: actualRank,
          power_rank: powerRank,
          median_rank: medianRank,
          combined_rank: combinedRank,
          power_wins: analytics.power_wins,
          power_losses: analytics.power_losses,
          power_ties: analytics.power_ties,
          median_wins: analytics.median_wins,
          median_losses: analytics.median_losses,
          median_ties: analytics.median_ties,
          combined_wins: analytics.combined_wins,
          combined_losses: analytics.combined_losses,
          combined_ties: analytics.combined_ties,
        },
      });
    }

    // --- 2. Calculate LeagueRecords (Top/Bottom Scores, Awards) ---
    const regularSeasonMatchups = allMatchups.filter(m => !m.is_playoff);

    if (regularSeasonMatchups.length > 0) {
      // Top 5 Scores
      const allScores = regularSeasonMatchups.flatMap(m => [
        { team_id: m.home_team_id, week: m.week, score: m.home_score },
        { team_id: m.away_team_id, week: m.week, score: m.away_score },
      ]);

      allScores.sort((a, b) => b.score - a.score);

      for (let i = 0; i < 5 && i < allScores.length; i++) {
        await prisma.leagueRecord.create({
          data: {
            season_year: season.year,
            week: allScores[i].week,
            record_type: 'highest_score',
            team_id: allScores[i].team_id,
            value: allScores[i].score,
          },
        });
      }
      
      // Bottom 5 Scores
      for (let i = allScores.length - 1; i >= 0 && i > allScores.length - 6; i--) {
        await prisma.leagueRecord.create({
          data: {
            season_year: season.year,
            week: allScores[i].week,
            record_type: 'lowest_score',
            team_id: allScores[i].team_id,
            value: allScores[i].score,
          },
        });
      }

      // Matchup Awards (Blowout & Nailbiter)
      let blowout = { margin: 0, matchup_id: 0, week: 0 };
      let nailbiter = { margin: Infinity, matchup_id: 0, week: 0 };

      for (const matchup of regularSeasonMatchups) {
        const margin = Math.abs(matchup.home_score - matchup.away_score);
        if (margin > blowout.margin) {
          blowout = { margin, matchup_id: matchup.id, week: matchup.week };
        }
        if (margin < nailbiter.margin) {
          nailbiter = { margin, matchup_id: matchup.id, week: matchup.week };
        }
      }

      await prisma.leagueRecord.create({
        data: {
          season_year: season.year,
          week: blowout.week,
          record_type: 'blowout',
          matchup_id: blowout.matchup_id,
          value: blowout.margin,
        },
      });
      
      await prisma.leagueRecord.create({
        data: {
          season_year: season.year,
          week: nailbiter.week,
          record_type: 'nailbiter',
          matchup_id: nailbiter.matchup_id,
          value: nailbiter.margin,
        },
      });
    }
  }

  console.log('Analytics calculation complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
