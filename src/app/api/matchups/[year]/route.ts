import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ year: string }> }
) {
    try {
        const resolvedParams = await params;
        const year = parseInt(resolvedParams.year, 10);

        // Get all matchups for the year (both regular season and playoffs)
        const matchups = await prisma.matchup.findMany({
            where: { season_year: year },
            include: {
                home_team: true,
                away_team: true
            },
            orderBy: [
                { is_playoff: 'asc' },
                { week: 'asc' }
            ]
        });

        if (!matchups || matchups.length === 0) {
            return NextResponse.json({ error: "No matchups found for this year" }, { status: 404 });
        }

        // Process matchups into a more usable format
        const processedMatchups = matchups.map(matchup => {
            const winner = matchup.home_score > matchup.away_score ? matchup.home_team.team_name : 
                         matchup.away_score > matchup.home_score ? matchup.away_team.team_name : 'Tie';
            
            return {
                id: matchup.id,
                week: matchup.week,
                is_playoff: matchup.is_playoff,
                home_team: matchup.home_team.team_name,
                home_team_id: matchup.home_team_id,
                home_team_logo: matchup.home_team.logo_url ?? null,
                home_score: matchup.home_score,
                away_team: matchup.away_team.team_name,
                away_team_id: matchup.away_team_id,
                away_team_logo: matchup.away_team.logo_url ?? null,
                away_score: matchup.away_score,
                winner: winner,
                margin: Math.abs(matchup.home_score - matchup.away_score),
                total_score: matchup.home_score + matchup.away_score,
                round: matchup.is_playoff ? getPlayoffRound(matchup.week) : `Week ${matchup.week}`,
                detail_link: `/matchups/${year}/${matchup.week}/${matchup.home_team_id}/${matchup.away_team_id}`
            };
        });

        // Group by week/round
        const matchupsByWeek = processedMatchups.reduce((acc, matchup) => {
            const key = matchup.is_playoff ? `Playoff - ${matchup.round}` : `Week ${matchup.week}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(matchup);
            return acc;
        }, {} as Record<string, typeof processedMatchups>);

        return NextResponse.json({
            year: year,
            matchups: processedMatchups,
            matchups_by_week: matchupsByWeek,
            stats: {
                total_games: processedMatchups.length,
                regular_season_games: processedMatchups.filter(m => !m.is_playoff).length,
                playoff_games: processedMatchups.filter(m => m.is_playoff).length,
                average_score: processedMatchups.reduce((sum, m) => sum + m.total_score, 0) / processedMatchups.length,
                highest_score: Math.max(...processedMatchups.map(m => m.total_score)),
                lowest_score: Math.min(...processedMatchups.map(m => m.total_score)),
                biggest_blowout: Math.max(...processedMatchups.map(m => m.margin)),
                closest_game: Math.min(...processedMatchups.map(m => m.margin))
            }
        });
    } catch (error) {
        console.error('Error fetching matchups:', error);
        return NextResponse.json({ error: 'Failed to fetch matchups data' }, { status: 500 });
    }
}

function getPlayoffRound(week: number): string {
    switch (week) {
        case 15: return 'Quarter-Finals';
        case 16: return 'Semi-Finals';
        case 17: return 'Championship';
        default: return `Week ${week}`;
    }
} 