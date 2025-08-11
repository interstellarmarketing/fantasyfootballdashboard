import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Matchup, Team } from '@prisma/client';

export async function GET() {
    try {
        // Get all teams ordered newest to oldest
        const teams = await prisma.team.findMany({
            orderBy: { season_year: 'desc' }
        });

        // Early return if no data
        if (!teams || teams.length === 0) {
            return NextResponse.json({ all_time_standings: [] });
        }

        // Build helper indexes
        const seasonYears = Array.from(new Set(teams.map(t => t.season_year)));

        // Fetch ALL regular-season matchups for those seasons
        const allMatchups: Matchup[] = await prisma.matchup.findMany({
            where: { season_year: { in: seasonYears }, is_playoff: false }
        });

        // Build scores by season/week for All-Play calculations
        const scoresBySeasonWeek: Record<number, Record<number, number[]>> = {};
        for (const m of allMatchups) {
            if (!scoresBySeasonWeek[m.season_year]) scoresBySeasonWeek[m.season_year] = {};
            if (!scoresBySeasonWeek[m.season_year][m.week]) scoresBySeasonWeek[m.season_year][m.week] = [];
            // Push both scores like team history implementation
            scoresBySeasonWeek[m.season_year][m.week].push(m.home_score, m.away_score);
        }

        // Build mapping from team_id -> their regular season matchups
        const teamIdToMatchups = new Map<number, Matchup[]>();
        for (const m of allMatchups) {
            if (!teamIdToMatchups.has(m.home_team_id)) teamIdToMatchups.set(m.home_team_id, []);
            teamIdToMatchups.get(m.home_team_id)!.push(m);
            if (m.away_team_id) {
                if (!teamIdToMatchups.has(m.away_team_id)) teamIdToMatchups.set(m.away_team_id, []);
                teamIdToMatchups.get(m.away_team_id)!.push(m);
            }
        }

        // Group teams by season for Points-For percentile within each season
        const teamsBySeason = new Map<number, Team[]>();
        for (const t of teams) {
            if (!teamsBySeason.has(t.season_year)) teamsBySeason.set(t.season_year, []);
            teamsBySeason.get(t.season_year)!.push(t as Team);
        }

        // Precompute PF percentile (per-game) per team within each season
        const teamIdToPfPercentile = new Map<number, number>();
        for (const seasonTeams of teamsBySeason.values()) {
            const withPerGame = seasonTeams.map(t => {
                const games = t.wins + t.losses + t.ties;
                const pfPerGame = games > 0 ? t.points_for / games : 0;
                return { id: t.id, pfPerGame };
            });
            const sorted = withPerGame.sort((a, b) => b.pfPerGame - a.pfPerGame);
            const N = sorted.length || 1;
            sorted.forEach((entry, idx) => {
                const rank = idx + 1; // 1 is best
                const percentile = (N - rank + 1) / N; // 1.0 best -> 0 worst
                teamIdToPfPercentile.set(entry.id, percentile);
            });
        }

        // Group teams by owner name to preserve historical ownership
        const ownerMap = new Map<string, Team[]>();
        for (const team of teams) {
            const ownerKey = team.owner_name || 'Unknown';
            if (!ownerMap.has(ownerKey)) ownerMap.set(ownerKey, [] as Team[]);
            ownerMap.get(ownerKey)!.push(team as Team);
        }

        // Calculate all-time standings per owner using the hybrid formula
        const allTimeStandings: Array<{
            team_name: string;
            owner_name: string;
            original_team_name: string;
            record: string;
            win_pct: string;
            league_rating: number;
            championships: number;
            runner_ups: number;
            third_places: number;
            trophies: string;
            seasons_played: number;
        }> = [];

        for (const [ownerName, teamSeasons] of ownerMap.entries()) {
            // Latest team name for display
            const latestTeam = teamSeasons[0];

            // Aggregate record
            const totalWins = teamSeasons.reduce((sum, t) => sum + t.wins, 0);
            const totalLosses = teamSeasons.reduce((sum, t) => sum + t.losses, 0);
            const totalTies = teamSeasons.reduce((sum, t) => sum + t.ties, 0);
            const totalGames = totalWins + totalLosses + totalTies;
            const winPercentage = totalGames > 0 ? totalWins / totalGames : 0;

            // Trophy counts
            const championships = teamSeasons.filter(t => t.final_standing === 1).length;
            const runnerUps = teamSeasons.filter(t => t.final_standing === 2).length;
            const thirdPlaces = teamSeasons.filter(t => t.final_standing === 3).length;

            // Aggregate All-Play across seasons
            let allPlayWinsTotal = 0;
            let allPlayGamesTotal = 0;
            for (const t of teamSeasons) {
                const matchups = teamIdToMatchups.get(t.id) || [];
                for (const m of matchups) {
                    if (m.is_playoff || m.season_year !== t.season_year) continue;
                    const teamScore = m.home_team_id === t.id ? m.home_score : m.away_score;
                    const weeklyScores = scoresBySeasonWeek[t.season_year]?.[m.week] || [];
                    allPlayWinsTotal += weeklyScores.filter(s => teamScore > s).length;
                    allPlayGamesTotal += Math.max(weeklyScores.length - 1, 0);
                }
            }
            const allPlayPct = allPlayGamesTotal > 0 ? allPlayWinsTotal / allPlayGamesTotal : 0;

            // Aggregate PF percentile across seasons (weighted by number of games played in that season)
            let weightedPfSum = 0;
            let pfWeight = 0;
            for (const t of teamSeasons) {
                const games = t.wins + t.losses + t.ties;
                const pfPct = teamIdToPfPercentile.get(t.id) ?? 0;
                weightedPfSum += pfPct * games;
                pfWeight += games;
            }
            const pfPercentile = pfWeight > 0 ? weightedPfSum / pfWeight : 0;

            // Hybrid formula
            // rating = round(450·win% + 300·allPlay% + 250·PF_pct + 100·champs + 50·runnerUps + 25·thirds)
            const leagueRating = Math.round(
                450 * winPercentage +
                300 * allPlayPct +
                250 * pfPercentile +
                100 * championships +
                50 * runnerUps +
                25 * thirdPlaces
            );

            const trophies = '🏆'.repeat(championships) + '🥈'.repeat(runnerUps) + '🥉'.repeat(thirdPlaces);

            allTimeStandings.push({
                team_name: latestTeam.team_name,
                owner_name: ownerName,
                original_team_name: latestTeam.team_name,
                record: `${totalWins}-${totalLosses}${totalTies > 0 ? `-${totalTies}` : ''}`,
                win_pct: winPercentage.toFixed(3),
                league_rating: leagueRating,
                championships,
                runner_ups: runnerUps,
                third_places: thirdPlaces,
                trophies: trophies || 'None',
                seasons_played: teamSeasons.length
            });
        }

        // Sort by league rating
        allTimeStandings.sort((a, b) => b.league_rating - a.league_rating);

        return NextResponse.json({ all_time_standings: allTimeStandings });
    } catch (error) {
        console.error('Error fetching league history:', error);
        return NextResponse.json({ error: 'Failed to fetch league history data' }, { status: 500 });
    }
}