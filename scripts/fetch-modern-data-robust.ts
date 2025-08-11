import { PrismaClient } from '@prisma/client';
import { Client } from 'espn-fantasy-football-api/node';
import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// --- Robust .env loading ---
const envPath = path.resolve(__dirname, '../.env');
try {
  const envFileContent = fs.readFileSync(envPath, 'utf8');
  const parsedEnv = dotenv.parse(envFileContent);
  // Manually apply to process.env
  for (const key in parsedEnv) {
    process.env[key] = parsedEnv[key];
  }
} catch (error) {
  console.error('Failed to read or parse .env file:', error);
  process.exit(1);
}
// --- End of .env loading ---

const prisma = new PrismaClient();

// Configuration
const LEAGUE_ID = process.env.ESPN_LEAGUE_ID;
const ESPN_S2 = process.env.ESPN_S2;
const SWID = process.env.ESPN_SWID;

if (!LEAGUE_ID || !ESPN_S2 || !SWID) {
  console.error('Missing required environment variables: ESPN_LEAGUE_ID, ESPN_S2, ESPN_SWID');
  process.exit(1);
}

async function fetchModernSeasonData(year: number) {
  console.log(`Fetching data for season ${year}...`);

  const myClient = new Client({ leagueId: parseInt(LEAGUE_ID!) });
  myClient.setCookies({ espnS2: ESPN_S2!, SWID: SWID! });
  
  try {
    // Clear all existing data for this season
    console.log(`Clearing existing data for ${year}...`);
    await prisma.transaction.deleteMany({ where: { season_year: year } });
    await prisma.draftPick.deleteMany({ where: { season_year: year } });
    await prisma.boxScorePlayer.deleteMany({ where: { matchup: { season_year: year } } });
    await prisma.matchup.deleteMany({ where: { season_year: year } });
    await prisma.teamSeasonStats.deleteMany({ where: { season_year: year }});
    await prisma.team.deleteMany({ where: { season_year: year } });
    await prisma.season.deleteMany({ where: { year } });

    const leagueInfo = await myClient.getLeagueInfo({ seasonId: year });
    const teamsData = await myClient.getTeamsAtWeek({ seasonId: year, scoringPeriodId: 1 });

    // Create season
    console.log(`Creating season ${year}...`);
    await prisma.season.create({
      data: {
        year,
        league_name: leagueInfo.name,
        regular_season_weeks: leagueInfo.scheduleSettings.numberOfRegularSeasonMatchups,
        is_legacy: year < 2018 // Corrected based on library behavior
      }
    });

    // Create teams and their season stats
    console.log(`Creating teams for ${year}...`);
    const teamsMap = new Map();
    const espnIdToDbIdMap = new Map();
    for (const team of teamsData) {
      const newTeam = await prisma.team.create({
        data: {
          season_year: year,
          espn_team_id: team.id,
          team_name: team.name,
          owner_name: team.ownerName || 'Unknown',
          logo_url: team.logo || null,
          wins: team.wins,
          losses: team.losses,
          ties: team.ties,
          points_for: team.regularSeasonPointsFor,
          points_against: team.regularSeasonPointsAgainst,
          final_standing: team.finalStandingsPosition
        }
      });
      teamsMap.set(team.id, newTeam);
      espnIdToDbIdMap.set(team.id, newTeam.id);

      await prisma.teamSeasonStats.create({
        data: {
          season_year: year,
          team_id: newTeam.id,
          wins: team.wins,
          losses: team.losses,
          ties: team.ties,
          points_for: team.regularSeasonPointsFor,
          points_against: team.regularSeasonPointsAgainst,
          actual_rank: team.finalStandingsPosition,
          power_rank: 0,
          median_rank: 0,
          combined_rank: 0
        }
      });
    }

    // Fetch and create matchups and box scores
    console.log(`Fetching matchups for ${year}...`);
    const { numberOfRegularSeasonMatchups, numberOfPlayoffMatchups } = leagueInfo.scheduleSettings;
    for (let week = 1; week <= numberOfRegularSeasonMatchups + numberOfPlayoffMatchups; week++) {
      const boxScores = await myClient.getBoxscoreForWeek({ seasonId: year, matchupPeriodId: week, scoringPeriodId: week });
      if (!boxScores || boxScores.length === 0) continue;

      console.log(`Processing ${boxScores.length} matchups for week ${week}`);

      for (const matchupData of boxScores) {
        // --- Bye Week Handling ---
        if (!matchupData.homeTeamId || !matchupData.awayTeamId) {
          const byeTeamId = matchupData.homeTeamId || matchupData.awayTeamId;
          const byeTeam = teamsMap.get(byeTeamId);
          if (!byeTeam) continue;

          const byeMatchup = await prisma.matchup.create({
            data: {
              season_year: year,
              week,
              home_team_id: byeTeam.id,
              away_team_id: null,
              home_score: matchupData.homeScore || matchupData.awayScore || 0,
              away_score: 0,
              is_playoff: week > numberOfRegularSeasonMatchups,
              is_bye: true
            }
          });

          const byeRoster = matchupData.homeRoster || matchupData.awayRoster;
          for (const playerData of byeRoster) {
             if (!playerData.id) continue;
             
             // Ensure player exists in database first
             try {
               await prisma.player.upsert({
                 where: { id: playerData.id },
                 update: {
                   full_name: playerData.fullName || 'Unknown Player',
                   position: playerData.defaultPosition || 'Unknown',
                   pro_team: playerData.proTeamAbbreviation || 'Unknown'
                 },
                 create: {
                   id: playerData.id,
                   full_name: playerData.fullName || 'Unknown Player',
                   position: playerData.defaultPosition || 'Unknown',
                   pro_team: playerData.proTeamAbbreviation || 'Unknown'
                 }
               });
               
               await prisma.boxScorePlayer.create({
                 data: {
                   matchup_id: byeMatchup.id,
                   team_id: byeTeam.id,
                   player_id: playerData.id,
                   slot_position: playerData.rosteredPosition || playerData.defaultPosition || 'Unknown',
                   points: playerData.totalPoints || 0,
                   projected_points: playerData.projectedTotalPoints || 0
                 }
               });
             } catch (error) {
               console.log(`Error creating bye week player ${playerData.fullName}:`, error.message);
             }
          }

          continue;
        }
        
        const homeTeam = teamsMap.get(matchupData.homeTeamId);
        const awayTeam = teamsMap.get(matchupData.awayTeamId);
        if (!homeTeam || !awayTeam) continue;

        const matchup = await prisma.matchup.create({
          data: {
            season_year: year,
            week,
            home_team_id: homeTeam.id,
            away_team_id: awayTeam.id,
            home_score: matchupData.homeScore,
            away_score: matchupData.awayScore,
            is_playoff: week > numberOfRegularSeasonMatchups
          }
        });

        const allPlayers = [...matchupData.homeRoster, ...matchupData.awayRoster];
        console.log(`Processing ${allPlayers.length} players for matchup ${matchup.id}`);
        
        for (const playerData of allPlayers) {
          if (!playerData.id) continue;

          try {
            // Ensure player exists in database first
            await prisma.player.upsert({
              where: { id: playerData.id },
              update: {
                full_name: playerData.fullName || 'Unknown Player',
                position: playerData.defaultPosition || 'Unknown',
                pro_team: playerData.proTeamAbbreviation || 'Unknown'
              },
              create: {
                id: playerData.id,
                full_name: playerData.fullName || 'Unknown Player',
                position: playerData.defaultPosition || 'Unknown',
                pro_team: playerData.proTeamAbbreviation || 'Unknown'
              }
            });
            
            // Determine which team this player belongs to
            let teamId: number | undefined;
            
            // Check if player is in home roster
            if (matchupData.homeRoster && matchupData.homeRoster.some(p => p.id === playerData.id)) {
              teamId = homeTeam.id;
            }
            // Check if player is in away roster
            else if (matchupData.awayRoster && matchupData.awayRoster.some(p => p.id === playerData.id)) {
              teamId = awayTeam.id;
            }
            
            if (!teamId) {
              console.log(`Could not determine team for player ${playerData.fullName} (ID: ${playerData.id})`);
              continue;
            }

            await prisma.boxScorePlayer.create({
              data: {
                matchup_id: matchup.id,
                team_id: teamId,
                player_id: playerData.id,
                slot_position: playerData.rosteredPosition || playerData.defaultPosition || 'Unknown',
                points: playerData.totalPoints || 0,
                projected_points: playerData.projectedTotalPoints || 0
              }
            });
          } catch (error) {
            console.log(`Error creating player ${playerData.fullName}:`, error.message);
          }
        }
      }
    }

    // Fetch and create draft picks
    console.log(`Fetching draft details for ${year}...`);
    try {
      const draftInfo = await myClient.getDraftInfo({ seasonId: year });
      for (const draftPick of draftInfo) {
        const teamId = espnIdToDbIdMap.get(draftPick.teamId);
        if (!teamId || !draftPick.id) continue;
        
        try {
          // Handle different possible field names for draft pick data
          const playerName = draftPick.fullName || draftPick.name || 'Unknown Player';
          const playerPosition = draftPick.defaultPosition || draftPick.position || 'Unknown';
          const playerTeam = draftPick.proTeamAbbreviation || draftPick.proTeam || 'Unknown';
          
          await prisma.player.upsert({
            where: { id: draftPick.id },
            update: {
              full_name: playerName,
              position: playerPosition,
              pro_team: playerTeam
            },
            create: {
              id: draftPick.id,
              full_name: playerName,
              position: playerPosition,
              pro_team: playerTeam
            }
          });
          
          await prisma.draftPick.create({
            data: {
              season_year: year,
              team_id: teamId,
              player_id: draftPick.id,
              round_num: draftPick.roundNumber || 0,
              round_pick: draftPick.roundPickNumber || 0,
              bid_amount: draftPick.bidAmount || 0
            }
          });
        } catch (error) {
          console.log(`Error creating draft pick:`, error.message);
        }
      }
    } catch (error) {
      console.log(`Error fetching draft info for ${year}:`, error.message);
    }

    // Transaction logic removed for now as the endpoint is incorrect.
    console.log('Skipping transactions for now.');

    console.log(`Successfully fetched and stored data for season ${year}`);
  } catch (error) {
    console.error(`Error fetching data for season ${year}:`, error);
  }
}

async function main() {
  const currentYear = new Date().getFullYear();
  
  console.log('--- Fetching All Modern Historical Data ---');
  
  for (let year = currentYear; year >= 2018; year--) {
    await fetchModernSeasonData(year);
  }
  
  console.log('--- Modern Data Fetch Complete! ---');
}

main()
  .catch((e) => {
    console.error('\n--- An error occurred during modern data fetch ---');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 