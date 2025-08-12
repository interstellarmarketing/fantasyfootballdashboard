import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Define a type for the team with relations to be safe
type TeamWithRelations = Prisma.TeamGetPayload<{
    include: {
        home_matchups: true,
        away_matchups: true,
    }
}>;

// Pre-calculate all scores by season and week for efficient lookups
function buildScoresBySeasonWeek(matchups: Prisma.MatchupGetPayload<{ select: { season_year: true; week: true; home_score: true; away_score: true } }>[]) {
    const scoresBySeasonWeek: { [year: number]: { [week: number]: number[] } } = {};
    
    for (const m of matchups) {
        if (!scoresBySeasonWeek[m.season_year]) {
            scoresBySeasonWeek[m.season_year] = {};
        }
        if (!scoresBySeasonWeek[m.season_year][m.week]) {
            scoresBySeasonWeek[m.season_year][m.week] = [];
        }
        scoresBySeasonWeek[m.season_year][m.week].push(m.home_score, m.away_score);
    }
    
    return scoresBySeasonWeek;
}

// Calculate season score with pre-fetched data
function calculateSeasonScore(year: number, teamId: number, allTeamsInSeason: TeamWithRelations[], scoresBySeasonWeek: { [week: number]: number[] }) {
    const team = allTeamsInSeason.find(t => t.espn_team_id === teamId);
    if (!team) return { season_score: 0 };

    const N = allTeamsInSeason.length;

    // R_reg calculation
    const sortedByRegRank = [...allTeamsInSeason].sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.points_for - a.points_for;
    });
    const R_reg_rank = sortedByRegRank.findIndex(t => t.id === team.id) + 1;
    const R_reg = (N - R_reg_rank + 1) / N;

    // R_pts calculation
    const sortedByPtsRank = [...allTeamsInSeason].sort((a, b) => b.points_for - a.points_for);
    const R_pts_rank = sortedByPtsRank.findIndex(t => t.id === team.id) + 1;
    const R_pts = (N - R_pts_rank + 1) / N;

    // P_all calculation using pre-fetched data
    const teamMatchups = team.home_matchups.concat(team.away_matchups).filter(m => !m.is_playoff && m.season_year === year);
    
    let allPlayWins = 0;
    let allPlayGames = 0;

    for (const m of teamMatchups) {
        const teamScore = m.home_team_id === team.id ? m.home_score : m.away_score;
        const weeklyScores = scoresBySeasonWeek[m.week] || [];
        allPlayWins += weeklyScores.filter(s => teamScore > s).length;
        allPlayGames += weeklyScores.length - 1;
    }
    const P_all = allPlayGames > 0 ? allPlayWins / allPlayGames : 0;

    // R_fin calculation
    const R_fin_map: { [key: number]: number } = { 1: 1.0, 2: 0.8, 3: 0.6, 4: 0.5 };
    const R_fin = R_fin_map[team.final_standing] || 0.3;

    const score = 100 * (0.20 * R_reg + 0.35 * R_pts + 0.35 * P_all + 0.10 * R_fin);
    return { season_score: parseFloat(score.toFixed(2)) };
}

// Calculate luck index with pre-fetched data
function getLuckIndex(year: number, team: TeamWithRelations, scoresBySeasonWeek: { [week: number]: number[] }) {
    let expectedWins = 0;
    const teamMatchups = team.home_matchups.concat(team.away_matchups).filter(m => !m.is_playoff && m.season_year === year);

    for (const matchup of teamMatchups) {
        const teamScore = matchup.home_team_id === team.id ? matchup.home_score : matchup.away_score;
        const allOtherScores = scoresBySeasonWeek[matchup.week] || [];
        const winsThisWeek = allOtherScores.filter(score => teamScore > score).length;
        const numOpponents = allOtherScores.length - 1;
        if (numOpponents > 0) {
            expectedWins += winsThisWeek / numOpponents;
        }
    }
    return team.wins - expectedWins;
}

function getTrophy(rank: number): string {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
}

export async function GET(req: Request, { params }: { params: Promise<{ team_id: string }> }) {
    const { searchParams } = new URL(req.url);
    const resolvedParams = await params;
    const teamId = parseInt(resolvedParams.team_id, 10);

    // Fetch all teams for the given team ID across all seasons
    const teams = await prisma.team.findMany({
        where: { espn_team_id: teamId },
        orderBy: { season_year: 'desc' },
        include: { home_matchups: true, away_matchups: true }
    });

    if (!teams || teams.length === 0) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const seasonYears = teams.map(t => t.season_year);

    // Fetch ALL matchups for all seasons in one query
    const allMatchups = await prisma.matchup.findMany({
        where: { season_year: { in: seasonYears }, is_playoff: false }
    });

    // Build scores lookup table
    const allScoresBySeasonWeek = buildScoresBySeasonWeek(allMatchups);
    
    // Fetch ALL teams for all seasons in one query
    const allTeamsQuery = await prisma.team.findMany({
        where: { season_year: { in: seasonYears } },
        include: { home_matchups: true, away_matchups: true }
    });

    // Group teams by season
    const allTeamsBySeason: { [year: number]: TeamWithRelations[] } = {};
    for (const t of allTeamsQuery) {
        if (!allTeamsBySeason[t.season_year]) allTeamsBySeason[t.season_year] = [];
        allTeamsBySeason[t.season_year].push(t);
    }

    const season_history = [];
    for (const team of teams) {
        const year = team.season_year;
        const scores_by_week = allScoresBySeasonWeek[year] || {};

        let allPlayWins = 0, allPlayLosses = 0;
        const teamMatchups = team.home_matchups.concat(team.away_matchups).filter(m => !m.is_playoff && m.season_year === year);
        
        for (const m of teamMatchups) {
            const teamScore = m.home_team_id === team.id ? m.home_score : m.away_score;
            for (const opponentScore of (scores_by_week[m.week] || [])) {
                if (teamScore > opponentScore) allPlayWins++;
                else if (teamScore < opponentScore) allPlayLosses++;
            }
        }

        const numGames = team.wins + team.losses + team.ties;
        const luck = getLuckIndex(year, team, scores_by_week);
        const { season_score } = calculateSeasonScore(year, team.espn_team_id, allTeamsBySeason[year], scores_by_week);
        
        season_history.push({
            year,
            team_name: team.team_name,
            record: `${team.wins}-${team.losses}`,
            all_play_record: `${allPlayWins}-${allPlayLosses}`,
            points_for: team.points_for,
            points_for_avg: numGames > 0 ? team.points_for / numGames : 0,
            points_vs: team.points_against,
            points_vs_avg: numGames > 0 ? team.points_against / numGames : 0,
            luck,
            sos: 0, // SOS calculation is complex and deferred
            season_score,
            rank: team.final_standing,
            trophy: getTrophy(team.final_standing)
        });
    }

    const summary = {
        record: `${teams.reduce((s, t) => s + t.wins, 0)}-${teams.reduce((s, t) => s + t.losses, 0)}-${teams.reduce((s, t) => s + t.ties, 0)}`,
        points_for: teams.reduce((s, t) => s + t.points_for, 0),
        playoff_appearances: teams.filter(t => t.final_standing <= 4).length,
        championships: teams.filter(t => t.final_standing === 1).length
    };

    return NextResponse.json({
        team_name: teams[0].team_name,
        owner_name: teams[0].owner_name,
        summary,
        season_history
    });
}
