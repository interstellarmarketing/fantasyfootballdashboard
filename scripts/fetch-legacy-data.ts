import { PrismaClient } from '@prisma/client';
import { Client } from 'espn-fantasy-football-api/node';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

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
const START_YEAR = 2015; // <--- SET YOUR LEAGUE'S FIRST YEAR HERE

if (!LEAGUE_ID || !ESPN_S2 || !SWID) {
  console.error('Missing required environment variables: ESPN_LEAGUE_ID, ESPN_S2, ESPN_SWID');
  process.exit(1);
}

async function fetchLegacySeasonData(year: number) {
  console.log(`Fetching LEGACY data for season ${year}...`);

  const myClient = new Client({ leagueId: parseInt(LEAGUE_ID!) });
  myClient.setCookies({ espnS2: ESPN_S2!, SWID: SWID! });
  
  try {
    // --- Correctly fetch legacy settings ---
    const legacyRoute = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/leagueHistory/${LEAGUE_ID}?seasonId=${year}&view=mSettings&view=mRoster&view=mTeam`;
    const legacyConfig = {
      headers: {
        Cookie: `espn_s2=${ESPN_S2}; SWID=${SWID};`
      }
    };
    const response = await axios.get(legacyRoute, legacyConfig);
    const legacyData = response.data[0];
    const teamsData = await myClient.getHistoricalTeamsAtWeek({ seasonId: year, scoringPeriodId: 1 });
    // --- End of corrected settings fetch ---

    // Clear existing data for this season
    console.log(`Clearing existing data for ${year}...`);
    await prisma.transaction.deleteMany({ where: { season_year: year } });
    await prisma.draftPick.deleteMany({ where: { season_year: year } });
    await prisma.boxScorePlayer.deleteMany({ where: { matchup: { season_year: year } } });
    await prisma.matchup.deleteMany({ where: { season_year: year } });
    await prisma.teamSeasonStats.deleteMany({ where: { season_year: year }});
    await prisma.team.deleteMany({ where: { season_year: year } });
    await prisma.season.deleteMany({ where: { year } });
    
    const regular_season_weeks = legacyData.settings.scheduleSettings.matchupPeriodCount;

    console.log(`Creating season ${year}...`);
    await prisma.season.create({
      data: {
        year,
        league_name: legacyData.settings.name,
        regular_season_weeks,
        is_legacy: true
      }
    });

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

    console.log(`Fetching matchups for ${year}...`);
    for (let week = 1; week <= regular_season_weeks + 3; week++) { // Assuming 3 playoff weeks
      const matchups = await myClient.getHistoricalScoreboardForWeek({ seasonId: year, matchupPeriodId: week, scoringPeriodId: week });
      if (!matchups || matchups.length === 0) continue;

      console.log(`Processing ${matchups.length} matchups for week ${week}`);

      for (const matchupData of matchups) {
          // --- Robust Bye Week Handling for Legacy ---
          // Legacy API returns Boxscore objects with homeTeamId/awayTeamId and homeScore/awayScore
          if (!matchupData.homeTeamId || !matchupData.awayTeamId) {
            const byeTeamId = matchupData.homeTeamId || matchupData.awayTeamId;
            
            // If the record is truly empty, skip it.
            if (!byeTeamId) continue;

            const byeTeam = teamsMap.get(byeTeamId);
            if (!byeTeam) continue;

            await prisma.matchup.create({
              data: {
                season_year: year,
                week,
                home_team_id: byeTeam.id,
                away_team_id: null,
                home_score: matchupData.homeScore || matchupData.awayScore || 0,
                away_score: 0,
                is_playoff: week > regular_season_weeks,
                is_bye: true
              }
            });
            continue; // Skip to the next matchup
          }
          // --- End of Bye Week Handling ---

          const homeTeam = teamsMap.get(matchupData.homeTeamId);
          const awayTeam = teamsMap.get(matchupData.awayTeamId);
          if (!homeTeam || !awayTeam) continue;

          await prisma.matchup.create({
              data: {
                  season_year: year,
                  week,
                  home_team_id: homeTeam.id,
                  away_team_id: awayTeam.id,
                  home_score: matchupData.homeScore,
                  away_score: matchupData.awayScore,
                  is_playoff: week > regular_season_weeks
              }
          });
      }
    }
    
    console.log(`Successfully fetched and stored data for legacy season ${year}`);
    console.log('NOTE: Player roster data is not available for legacy seasons (pre-2018) due to ESPN API limitations.');
    console.log('NOTE: Draft and transaction data is not available for legacy seasons with this client.');

  } catch (error) {
    console.error(`Error fetching data for legacy season ${year}:`, error);
  }
}

async function main() {
  console.log('--- Fetching All Legacy Historical Data ---');
  
  for (let year = 2017; year >= START_YEAR; year--) {
    await fetchLegacySeasonData(year);
  }
  
  console.log('--- Legacy Data Fetch Complete! ---');
}

main()
  .catch((e) => {
    console.error('\n--- An error occurred during legacy data fetch ---');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
