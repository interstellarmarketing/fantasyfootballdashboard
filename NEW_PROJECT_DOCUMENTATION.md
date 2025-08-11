# ESPN Fantasy Football Dashboard - Next.js Edition

Welcome to the new and improved ESPN Fantasy Football Dashboard! This document provides a comprehensive overview of the project, its structure, and how to get started.

## 1. Project Overview

This application is a web-based dashboard that provides an in-depth, personalized view of your ESPN Fantasy Football league's data. It is built with a modern, robust, and scalable technology stack, designed for a great developer experience and a fast, responsive user interface.

## 2. Technology Stack

-   **Framework**: [Next.js](https://nextjs.org/) (with the App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
-   **Data Fetching**: [React Query](https://tanstack.com/query/latest)
-   **Database ORM**: [Prisma](https://www.prisma.io/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/) (hosted on [Neon](https://neon.tech/))

## 3. Project Structure

The project is organized into the following directory structure, with all application code residing in the `src` directory:

```
espn-dashboard/
├── src/
│   ├── app/                  # Application routes, pages, and API handlers
│   │   ├── api/
│   │   │   ├── league/[year]/route.ts
│   │   │   └── teams/history/[team_id]/route.ts
│   │   ├── team/[id]/
│   │   │   └── page.tsx      # Team history page
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/
│   │   ├── charts/           # Chart components (e.g., using Recharts)
│   │   ├── layout/           # Layout components (e.g., Navbar, Footer)
│   │   ├── tables/           # Table components
│   │   ├── league-dashboard.tsx  # Main dashboard component
│   │   ├── team-history.tsx      # Team history component
│   │   └── query-provider.tsx    # React Query provider
│   └── lib/
│       ├── api.ts            # Helper functions for API calls
│       └── prisma.ts         # Prisma client instance
├── prisma/
│   ├── migrations/           # Database migration files
│   └── schema.prisma         # Prisma database schema
├── scripts/
│   └── migrate-data.ts       # Script to migrate data from SQLite to PostgreSQL
├── public/                   # Static assets (images, fonts, etc.)
├── .env                      # Local environment variables
├── package.json              # Project dependencies and scripts
└── ...
```

## 4. Getting Started

To get the project up and running locally, follow these steps:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Set Up Environment Variables**:
    Create a `.env` file in the root of the project. You will need a PostgreSQL database connection string (e.g., from Neon).
    ```
    # Example for a Neon database
    DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
    ```

3.  **Run Database Migrations**:
    This will set up the tables in your PostgreSQL database based on the Prisma schema.
    ```bash
    npx prisma migrate dev
    ```

4.  **Populate the Database (Data Migration)**:
    If you have an existing `fantasy_league.db` SQLite file from the previous version of this project, you can migrate its data to your new PostgreSQL database.
    
    a. Make sure the `fantasy_league.db` file is in the root of the `espn-fantasy-api` directory (one level above the current `espn-dashboard` project).
    
    b. Run the migration script:
    ```bash
    ts-node scripts/migrate-data.ts
    ```
    This script will safely copy all valid data and warn you about any inconsistencies it finds and skips.

5.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:3000](http://localhost:3000).

## 5. Key Components and Logic

-   **API Routes**: The backend logic is handled by Next.js API route handlers located in `src/app/api/`. These handlers use the Prisma client (`src/lib/prisma.ts`) to interact with the database.
    -   `src/app/api/league/[year]/route.ts`: Fetches and processes data for the main league dashboard.
    -   `src/app/api/teams/history/[team_id]/route.ts`: Fetches and processes the historical data for a specific team.

-   **Frontend Pages**: The main pages of the application are located in `src/app/`. These are React Server Components that act as entry points and fetch initial data.

-   **Client Components**: The interactive UI components are located in `src/components/`. These components use React Query (`@tanstack/react-query`) to fetch data from the API routes on the client side.
    -   `src/components/league-dashboard.tsx`: The main component for the home page, which displays the league standings, awards, and playoff bracket.
    -   `src/components/team-history.tsx`: The component for the team history page, which displays a team's historical stats and season-by-season performance.

-   **Data Fetching**: Data fetching is primarily handled on the client side by React Query. The `useQuery` hook is used in the client components to fetch, cache, and manage data from the API routes. The `fetchJSON` helper function in `src/lib/api.ts` is a simple wrapper around the `fetch` API.

-   **Database Schema**: The single source of truth for the database structure is `prisma/schema.prisma`. All changes to the database model should start in this file, followed by running `npx prisma migrate dev` to generate a new migration file.

This documentation should provide a solid starting point for any new developer joining the project.
