# Dashboard Architecture Improvement Recommendations

This document provides a comparative analysis of your current dashboard architecture against `fantasygenius.io` and offers recommendations for improvement. The suggestions are tailored to the specific needs of your single-league dashboard.

---

## Architectural Comparison

| Feature           | Your Dashboard                                       | `fantasygenius.io`                                                                         | Analysis & Key Differences                                                                                                                                                             |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend**       | Next.js API Routes                                   | FastAPI on Azure                                                                           | Both are valid choices. Next.js API routes are well-integrated with your frontend.                                                                                                   |
| **Database**      | PostgreSQL on Neon                                   | PostgreSQL (likely)                                                                        | Both projects use a modern, scalable SQL database.                                                                                                                                     |
| **Data Modeling** | Relational model with normalized tables.             | Relational model with extensive use of pre-computed tables for analytics.                  | `fantasygenius.io` pre-calculates weekly, team-level, and rivalry stats. This is a significant optimization for performance. Your model requires complex queries for analytics.        |
| **API Structure** | Ad-hoc API endpoints for specific components.        | Resource-oriented RESTful API (`/leagues`, `/teams`, etc.).                                  | `fantasygenius.io` has a more structured, RESTful API, making it more predictable and maintainable.                                                                                  |

---

## Recommendations for Improvement

Here are actionable recommendations to enhance your dashboard's architecture, inspired by `fantasygenius.io`.

### 1. Implement a Comprehensive Data Aggregation Strategy

This is the **highest-impact change** you can make. Pre-computing data is essential for a fast and responsive analytics dashboard.

**Actionable Steps:**

1.  **Create Aggregation Tables:**
    Add the following models to your `schema.prisma` file to store pre-computed stats.

    *   **For Team vs. League historical stats:**
        ```prisma
        model AggregatedTeamStats {
          id                  Int     @id @default(autoincrement())
          team_id             Int     @unique
          min_points          Float
          max_points          Float
          sum_points          Float
          mean_points         Float
          median_points       Float
          sum_points_oppo     Float
          mean_points_oppo    Float
          median_points_oppo  Float
          years_played        Int
          
          @@map("aggregated_team_stats")
        }
        ```

    *   **For weekly league-wide stats:**
        ```prisma
        model WeeklyAggregates {
          id            Int     @id @default(autoincrement())
          season_year   Int
          week          Int
          sum_points    Float
          min_points    Float
          max_points    Float
          median_points Float
          mean_points   Float

          @@unique([season_year, week])
          @@map("weekly_aggregates")
        }
        ```

    *   **For head-to-head rivalry stats:**
        ```prisma
        model RivalryStats {
          id          Int     @id @default(autoincrement())
          team1_id    Int
          team2_id    Int
          team1_wins  Int
          team2_wins  Int
          total_games Int

          @@unique([team1_id, team2_id])
          @@map("rivalry_stats")
        }
        ```

2.  **Create a Data Aggregation Script (`scripts/calculate-aggregates.ts`):**
    This script should be run after fetching new data from the ESPN API. It should:
    -   Populate the `AggregatedTeamStats` table with lifetime stats for each team.
    -   Populate the `WeeklyAggregates` table with league-wide stats for each week.
    -   Populate the `RivalryStats` table by iterating through all matchups for every pair of teams.

3.  **Update Your API to Use Aggregated Data:**
    Create new API endpoints to serve this pre-computed data, which will make your dashboard components faster and simpler.

### 2. Refine Your Database Schema

-   **Add Cascading Deletes:** To ensure data integrity, add `onDelete: Cascade` to the relations in your `schema.prisma` file. This will automatically delete related data when a season is removed. After updating, run `npx prisma migrate dev`.

### 3. Structure Your API Routes More Intuitively

-   **Adopt a Resource-Oriented Structure:**
    -   `/api/seasons/[year]`: For season-specific data.
    -   `/api/teams/[team_id]/history`: For all-time team data.
    -   `/api/analytics/weekly`: For league-wide weekly analytics.
    -   `/api/analytics/rivalries`: For head-to-head rivalry data.

---

## Summary of Recommendations

1.  **Implement Data Aggregation**: Create tables for team, weekly, and rivalry stats, and a script to populate them.
2.  **Refine Schema**: Add cascading deletes for better data integrity.
3.  **Restructure API Routes**: Organize your API around resources for maintainability.

By adopting these recommendations, you can build a powerful, performant, and scalable analytics dashboard.
