/*
  One-off script to update team logo URLs in the DB.
  Usage:
    node scripts/update-logos.js --year 2024   # update just one season
    node scripts/update-logos.js               # update all seasons found in DB

  Requirements:
    - DATABASE_URL set in espn-dashboard/.env
    - For fetching from ESPN: ESPN_LEAGUE_ID, ESPN_S2, SWID in .env
*/

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { Client } = require('espn-fantasy-football-api/node');

// Load env from espn-dashboard/.env when executed from repo root
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--year' && i + 1 < args.length) {
      out.year = parseInt(args[++i], 10);
    }
  }
  return out;
}

async function getSeasonsFromDb() {
  const seasons = await prisma.season.findMany({ select: { year: true }, orderBy: { year: 'desc' } });
  return seasons.map(s => s.year);
}

function createClient() {
  const leagueId = process.env.ESPN_LEAGUE_ID;
  const espnS2 = process.env.ESPN_S2;
  const swid = process.env.ESPN_SWID;

  if (!leagueId || !espnS2 || !swid) {
    throw new Error('Missing ESPN credentials (ESPN_LEAGUE_ID, ESPN_S2, SWID) in .env');
  }

  const client = new Client({ leagueId: parseInt(leagueId, 10) });
  client.setCookies({ espnS2, SWID: swid });
  return client;
}

async function fetchLogosModern(client, year) {
  const teams = await client.getTeamsAtWeek({ seasonId: year, scoringPeriodId: 1 });
  // Use logoURL (not logo)
  return teams.map(t => ({ espn_team_id: t.id, logo_url: t.logoURL || null, name: t.name }));
}

async function fetchLogosLegacy(client, year) {
  // For legacy seasons, use the historical endpoint suggested by the client
  const teams = await client.getHistoricalTeamsAtWeek({ seasonId: year, scoringPeriodId: 1 });
  // Use logoURL (not logo)
  return teams.map(t => ({ espn_team_id: t.id, logo_url: t.logoURL || null, name: t.name }));
}

async function fetchLogosForYear(year) {
  const client = createClient();
  if (year >= 2018) {
    return fetchLogosModern(client, year);
  }
  return fetchLogosLegacy(client, year);
}

async function updateYear(year) {
  console.log(`\nUpdating logos for season ${year}...`);
  const logos = await fetchLogosForYear(year);
  let updated = 0;
  for (const l of logos) {
    const res = await prisma.team.updateMany({
      where: { season_year: year, espn_team_id: l.espn_team_id },
      data: { logo_url: l.logo_url }
    });
    updated += res.count;
  }
  console.log(`Season ${year}: updated ${updated} team logo(s).`);
}

async function main() {
  const { year } = parseArgs();
  try {
    if (year) {
      await updateYear(year);
    } else {
      const years = await getSeasonsFromDb();
      if (years.length === 0) {
        console.log('No seasons found in DB. Nothing to update.');
        return;
      }
      for (const y of years) {
        await updateYear(y);
      }
    }
    console.log('\nLogo update complete.');
  } catch (err) {
    console.error('Error updating logos:', err.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();