# Fantasy Genius Data Architecture Analysis

This document outlines the data storage and retrieval architecture of fantasygenius.io, based on an analysis of a `.har` file capturing the network traffic of the web application.

## Overview

The application appears to use a hybrid architecture consisting of a **Supabase** backend for authentication and user management, and a **FastAPI** backend hosted on **Azure** for handling the core fantasy football data.

### Key Technologies

-   **Frontend**: The frontend is likely a modern JavaScript framework (the HAR file mentions React).
-   **Authentication & User Management**: [Supabase](https://supabase.io/) is used for handling user authentication and storing user-related data.
-   **Core Application Backend**: A [FastAPI](https://fastapi.tiangolo.com/) application hosted on Azure serves the primary fantasy football data.
-   **Database**: While not directly visible, it is highly probable that the FastAPI backend is connected to a relational database (like PostgreSQL, which is common with FastAPI) to store the league data. Supabase itself uses PostgreSQL.

---

## Data Retrieval and API Endpoints

The application fetches data from several endpoints. Here is a breakdown of the key API calls observed in the HAR file:

### 1. Authentication

-   **Endpoint**: `https://mdexccnjsclvstuitpwt.supabase.co/auth/v1/user`
-   **Method**: `GET`
-   **Description**: This endpoint is used to retrieve the currently authenticated user's data from Supabase.

### 2. User and League Data (FastAPI Backend)

The following endpoints are served by the FastAPI application hosted at `https://fantasygenius-fastapi.azurewebsites.net`.

-   **/user\_leagues/{user\_id}**: Fetches leagues associated with a user.
-   **/user\_team/{league\_id}/{user\_id}**: Retrieves a user's team in a specific league.
-   **/league\_years\_v2/{league\_id}**: Returns the years a league has been active.
-   **/league\_teams/{league\_id}/{year}**: Fetches all teams for a league in a given year.
-   **/league\_settings/{league\_id}/{year}**: Retrieves league settings.

### 3. Aggregated Analytics Endpoints

These endpoints provide pre-computed data for fast-loading analytics.

-   **/league\_aggs\_by\_week/{league\_id}**: Returns aggregated scoring data for each week of the league's history (sum, min, max, median, mean scores).
-   **/league\_history\_team\_week/{league\_id}**: A comprehensive endpoint with detailed historical data for every team, including aggregated point metrics for both the team and their opponents, and lists of top 20 highest/lowest scores.
-   **/league\_rivalry\_legacy/{league\_id}**: Returns a complete historical matchup history between every team in the league, including head-to-head records and summary statistics. This is used for the "Rivalries" page.
-   **/awards\_mid\_season/{league\_id}/{year}**: Intended to fetch mid-season awards.

### 4. Social Media Integration

-   **/bluesky\_tweets**: Fetches tweets from Bluesky, likely for a social media feed.

---

## Proposed Data Model and Storage Structure

The API endpoints suggest a well-structured relational database with extensive use of pre-computed tables for analytics.

### Core Data Tables

-   **Seasons**, **Teams**, **Players**, **Matchups**, **BoxScorePlayers**, **DraftPicks**.

### Data Aggregation Tables

The analytics endpoints strongly indicate the use of pre-computed tables:

-   **Aggregated\_Weekly\_Stats**: To store league-wide weekly stats.
-   **Team\_History\_Stats**: To store lifetime stats for each team, including opponent stats.
-   **Rivalry\_History**: To store head-to-head matchup history and summary stats between every pair of teams.

These tables are populated by a script that runs periodically to process the raw data from the core tables.

---

## Implementation Recommendations

1.  **Data Ingestion**: A robust script to fetch data from the ESPN API is crucial.
2.  **Pre-computation for Analytics**: For a responsive dashboard, pre-calculating and storing aggregated data is essential. Create and populate the aggregation tables described above.
3.  **API Design**: Follow a resource-oriented API design (e.g., `/leagues`, `/teams`).

This analysis should provide a solid starting point for designing your dashboard's architecture.
