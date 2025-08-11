# Implementation Guide: High-Performance Dashboard

This document provides a step-by-step guide to refactor the ESPN Fantasy Football Dashboard. The goal is to implement a high-performance architecture by pre-computing and storing all analytical data, inspired by the analysis of `fantasygenius.io`.

Following this guide will result in a faster, more scalable, and more maintainable application.

---

## Phase 1: Update the Database Schema

First, we will update the `prisma/schema.prisma` file to include new tables for our pre-computed analytics and to improve data integrity.

**File to Edit:** `espn-dashboard/prisma/schema.prisma`

**Step 1.1: Add New Analytics Tables**
Add the following models to the bottom of your `schema.prisma` file. These tables will store the results of our data aggregation scripts.

```prisma
model TeamSeasonStats {
  id              Int     @id @default(autoincrement())
  season_year     Int
  team_id         Int
  
  wins            Int
  losses          Int
  ties            Int
  points_for      Float
  points_against  Float

  // We will calculate and store these ranks
  actual_rank     Int
  power_rank      Int
  median_rank     Int
  combined_rank   Int

  team            Team    @relation(fields: [team_id], references: [id])

  @@unique([season_year, team_id])
  @@map("team_season_stats")
}

model LeagueRecord {
  id                Int      @id @default(autoincrement())
  season_year       Int
  week              Int
  record_type       String   // e.g., "highest_score", "lowest_score", "blowout", "nailbiter"
  
  team_id           Int?
  matchup_id        Int?

  value             Float    // The score or margin of victory
  
  @@index([season_year, record_type])
  @@map("league_records")
}
```

**Step 1.2: Add Cascading Deletes**
To ensure that deleting a season cleans up all related data, add the `onDelete: Cascade` argument to the relations in your existing tables.

```prisma
// prisma/schema.prisma

model Team {
  // ... (keep existing fields)
  season            Season           @relation(fields: [season_year], references: [year], onDelete: Cascade)
}

model Matchup {
  // ... (keep existing fields)
  season            Season           @relation(fields: [season_year], references: [year], onDelete: Cascade)
}

model DraftPick {
  // ... (keep existing fields)
  season      Season @relation(fields: [season_year], references: [year], onDelete: Cascade)
}
```

**Step 1.3: Apply the Migration**
Open your terminal and run the following command to apply these changes to your database.

```bash
npx prisma migrate dev --name add-analytics-tables
```

---

## Phase 2: Create the Data Aggregation Script

This script will perform all the heavy calculations and populate our new analytics tables.

**Step 2.1: Create the Script File**
Create a new file at `espn-dashboard/scripts/calculate-analytics.ts`.

**Step 2.2: Add the Script Logic**
Paste the following boilerplate code into the new file. This script provides the structure and logic for calculating season stats and league records.

```typescript
// scripts/calculate-analytics.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    const allMatchups = await prisma.matchup.findMany({ where: { season_year: season.year } });
    
    // In a real implementation, you would calculate power, median, and combined ranks here.
    // For now, we will use placeholder logic.
    let rank = 1;
    for (const team of teams) {
      await prisma.teamSeasonStats.create({
        data: {
          season_year: season.year,
          team_id: team.id,
          wins: team.wins,
          losses: team.losses,
          ties: team.ties,
          points_for: team.points_for,
          points_against: team.points_against ?? 0,
          actual_rank: team.final_standing,
          power_rank: rank, // Placeholder
          median_rank: rank, // Placeholder
          combined_rank: rank, // Placeholder
        },
      });
      rank++;
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
```

**Step 2.3: Run the Script**
Execute the script from your terminal to populate the new tables.

```bash
npx ts-node espn-dashboard/scripts/calculate-analytics.ts
```

---

## Phase 3: Create New API Endpoints

Next, we will create new, fast API endpoints that serve the pre-computed data.

**Step 3.1: Create Standings API Route**
Create a new file: `espn-dashboard/src/app/api/seasons/[year]/standings/route.ts`

```typescript
// src/app/api/seasons/[year]/standings/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { year: string } }) {
  const year = parseInt(params.year, 10);

  const standings = await prisma.teamSeasonStats.findMany({
    where: { season_year: year },
    include: {
      team: true, // Include team details like name
    },
    orderBy: {
      actual_rank: 'asc',
    },
  });

  // Add tier logic
  const standingsWithTiers = standings.map(s => {
    let tier = 'Mid-Tier';
    if (s.combined_rank <= 4) tier = 'Contender';
    if (s.combined_rank >= 10) tier = 'Dumpster Fire. Awful.';
    return { ...s, tier };
  });

  return NextResponse.json(standingsWithTiers);
}
```

**Step 3.2: Create Records API Route**
Create a new file: `espn-dashboard/src/app/api/seasons/[year]/records/route.ts`

```typescript
// src/app/api/seasons/[year]/records/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { year: string } }) {
  const year = parseInt(params.year, 10);

  const records = await prisma.leagueRecord.findMany({
    where: { season_year: year },
  });

  return NextResponse.json(records);
}
```

---

## Phase 4: Update the Frontend

Finally, update your frontend components to use the new, fast API endpoints.

**File to Edit:** `espn-dashboard/src/components/league-dashboard.tsx`

**Step 4.1: Update Data Fetching**
Modify the data fetching logic to call your new API endpoints. This will likely involve using `useQuery` from React Query.

```tsx
// src/components/league-dashboard.tsx

// Replace your existing data fetching logic with something like this:

const { data: standings, isLoading: isLoadingStandings } = useQuery({
  queryKey: ['standings', year],
  queryFn: () => fetch(`/api/seasons/${year}/standings`).then(res => res.json()),
});

const { data: records, isLoading: isLoadingRecords } = useQuery({
  queryKey: ['records', year],
  queryFn: () => fetch(`/api/seasons/${year}/records`).then(res => res.json()),
});

// You will then need to adapt your component's JSX to use the data from these queries.
// For example, to find the "blowout" record:
const blowout = records?.find(r => r.record_type === 'blowout');
```

**Step 4.2: Update Components**
You will need to go through `league-dashboard.tsx` and its child components (`standings-table.tsx`, etc.) and update them to use the new data structures from the `standings` and `records` queries.

This completes the refactoring process. The dashboard will now be powered by pre-computed data, resulting in a significantly faster and more scalable application.
