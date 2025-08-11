# Dashboard UI to Backend Mapping

This document outlines the necessary backend structure (database tables, schema, and API endpoints) required to populate the data displayed in the dashboard screenshot. The architecture is based on the principle of pre-computing and storing aggregated data for performance.

---

## Core Concept: Data Aggregation

To ensure the dashboard loads quickly, we should not perform complex calculations on every API request. Instead, we'll use a two-step process:
1.  **Data Ingestion**: A script will fetch raw data from the ESPN API and store it in normalized "core" tables (e.g., `Matchups`, `Teams`).
2.  **Data Aggregation**: A second script will run after ingestion to perform all the necessary calculations (ranks, records, awards) and save the results into dedicated "analytics" tables.

The dashboard's frontend will only query API endpoints that read from these fast, pre-aggregated analytics tables.

---

## Component Breakdown and Backend Requirements

### 1. League Standings & Team Rank Comparison

These two components are powered by the same dataset.

**UI Components:**
- `League Standings` table (with tabs for Actual, Power, Median, Combined ranks).
- `Team Rank Comparison` table.

**Data Required:**
- For each team: Team Name, Actual Record (W-L-T), Points For (PF), Points Against (PA).
- Pre-calculated ranks: `actual_rank`, `power_rank`, `median_rank`, `combined_rank`.

**Database Schema:**
A new `TeamSeasonStats` table should be created to store this pre-computed data.

```prisma
// In your prisma/schema.prisma file

model TeamSeasonStats {
  id              Int     @id @default(autoincrement())
  season_year     Int
  team_id         Int
  
  wins            Int
  losses          Int
  ties            Int
  points_for      Float
  points_against  Float

  actual_rank     Int
  power_rank      Int
  median_rank     Int
  combined_rank   Int

  team            Team    @relation(fields: [team_id], references: [id])

  @@unique([season_year, team_id])
  @@map("team_season_stats")
}
```

**API Endpoint:**
- `GET /api/seasons/[year]/standings`
  - This endpoint would fetch all records from the `TeamSeasonStats` table for the given `[year]`.

---

### 2. Team Tiers

**UI Component:**
- `Team Tiers` card.

**Data Required:**
- A tier classification for each team (e.g., "Contender", "Mid-Tier", "Dumpster Fire").

**Logic & Implementation:**
- This is business logic, not raw data. The tiering can be determined based on the `combined_rank` from the `TeamSeasonStats` table.
- The logic can be applied in the `/api/seasons/[year]/standings` endpoint. Before sending the response, iterate through the teams and add a `tier` property to each team object based on their rank. This avoids needing a separate API call.

---

### 3. Top/Bottom 5 Scoring Weeks & Matchup Awards

These components display league records and notable matchups.

**UI Components:**
- `Top 5 Scoring Weeks` table.
- `Bottom 5 Scoring Weeks` table.
- `Matchup Awards` card (e.g., "Blowout", "Nailbiter").

**Data Required:**
- The best and worst weekly scores for the season.
- The matchups with the largest and smallest margins of victory.

**Database Schema:**
A new `LeagueRecords` table should be created to store these pre-calculated records.

```prisma
// In your prisma/schema.prisma file

model LeagueRecord {
  id                Int      @id @default(autoincrement())
  season_year       Int
  week              Int
  record_type       String   // e.g., "highest_score", "lowest_score", "blowout", "nailbiter"
  
  // For single-team records
  team_id           Int?
  
  // For matchup records
  matchup_id        Int?
  winning_team_id   Int?
  losing_team_id    Int?

  value             Float    // The score or margin of victory
  
  @@index([season_year, record_type])
  @@map("league_records")
}
```

**API Endpoint:**
- `GET /api/seasons/[year]/records`
  - This single endpoint can fetch all records for a given year. The frontend can then filter this data to populate the different UI components. For example:
    - `records.filter(r => r.record_type === 'highest_score').slice(0, 5)` for the Top 5 table.
    - `records.find(r => r.record_type === 'blowout')` for the Blowout award.

---

## Summary of New Backend Structure

### New Prisma Models:
- `TeamSeasonStats`
- `LeagueRecord`

### New API Endpoints:
- `GET /api/seasons/[year]/standings`
- `GET /api/seasons/[year]/records`

### New Scripts:
- `scripts/calculate-aggregates.ts`: This script will be the engine for pre-computing all the data for the analytics tables. It should be run after any updates to the core league data.
