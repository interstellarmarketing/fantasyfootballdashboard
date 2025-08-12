import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ year: string; week: string; team1: string; team2: string }> }
) {
    try {
        const resolvedParams = await params;
        const year = parseInt(resolvedParams.year, 10);
        const week = parseInt(resolvedParams.week, 10);
        const team1Id = parseInt(resolvedParams.team1, 10);
        const team2Id = parseInt(resolvedParams.team2, 10);

        console.log(`Looking for matchup: year=${year}, week=${week}, team1=${team1Id}, team2=${team2Id}`);

        // First, let's check what teams exist for this year
        const teams = await prisma.team.findMany({
            where: { season_year: year },
            select: { id: true, team_name: true, espn_team_id: true }
        });

        console.log(`Teams found for year ${year}:`, teams);

        // Check what matchups exist for this year and week
        const allMatchups = await prisma.matchup.findMany({
            where: { 
                season_year: year,
                week: week
            },
            include: {
                home_team: true,
                away_team: true
            }
        });

        console.log(`Matchups found for year ${year}, week ${week}:`, allMatchups.map(m => ({
            id: m.id,
            home_team: m.home_team?.team_name ?? 'TBD',
            away_team: m.away_team?.team_name ?? 'BYE',
            home_team_id: m.home_team_id,
            away_team_id: m.away_team_id ?? -1
        })));

        // Find the specific matchup
        const matchup = await prisma.matchup.findFirst({
            where: {
                season_year: year,
                week: week,
                OR: [
                    {
                        home_team_id: team1Id,
                        away_team_id: team2Id
                    },
                    {
                        home_team_id: team2Id,
                        away_team_id: team1Id
                    }
                ]
            },
            include: {
                home_team: true,
                away_team: true,
                box_score_players: {
                    include: {
                        player: true,
                        team: true
                    }
                }
            }
        });

        if (!matchup) {
            console.log(`No matchup found for the specified criteria`);
            return NextResponse.json({ 
                error: "Matchup not found",
                debug: {
                    searched_year: year,
                    searched_week: week,
                    searched_team1: team1Id,
                    searched_team2: team2Id,
                    available_teams: teams,
                    available_matchups: allMatchups.map(m => ({
                        id: m.id,
                        home_team: m.home_team?.team_name ?? 'TBD',
                        away_team: m.away_team?.team_name ?? 'BYE',
                        home_team_id: m.home_team_id,
                        away_team_id: m.away_team_id ?? -1
                    }))
                }
            }, { status: 404 });
        }

        // Determine which team is home and which is away
        const isTeam1Home = matchup.home_team_id === team1Id;
        const homeTeamEntity = isTeam1Home ? matchup.home_team : matchup.away_team;
        const awayTeamEntity = isTeam1Home ? matchup.away_team : matchup.home_team;
        const homeScore = isTeam1Home ? matchup.home_score : matchup.away_score;
        const awayScore = isTeam1Home ? matchup.away_score : matchup.home_score;
        const homeTeamIdNum = isTeam1Home ? matchup.home_team_id : (matchup.away_team_id ?? -1);
        const awayTeamIdNum = isTeam1Home ? (matchup.away_team_id ?? -1) : matchup.home_team_id;

        // Filter players by team using team IDs to avoid null entity issues
        const homePlayers = matchup.box_score_players.filter(player => player.team_id === homeTeamIdNum);
        const awayPlayers = matchup.box_score_players.filter(player => player.team_id === awayTeamIdNum);

        // Process player data
        type PlayerRow = Prisma.BoxScorePlayerGetPayload<{ include: { player: true; team: true } }>;
        const processPlayers = (players: PlayerRow[]) => {
            return players.map(player => ({
                id: player.player.id,
                name: player.player.full_name,
                position: player.player.position || 'N/A',
                team: player.player.pro_team || 'N/A',
                points: player.points,
                projected_points: player.projected_points,
                slot_position: player.slot_position,
                is_starter: player.slot_position !== 'BE' && player.slot_position !== 'IR',
                is_bench: player.slot_position === 'BE',
                is_injured: player.slot_position === 'IR'
            }));
        };

        const winner = homeScore > awayScore ? homeTeam.team_name : 
                      awayScore > homeScore ? awayTeam.team_name : 'Tie';

        return NextResponse.json({
            year: year,
            week: week,
            is_playoff: matchup.is_playoff,
            home_team: {
                id: homeTeamIdNum,
                name: homeTeamEntity?.team_name ?? 'TBD',
                score: homeScore,
                players: processPlayers(homePlayers)
            },
            away_team: {
                id: awayTeamIdNum,
                name: awayTeamEntity?.team_name ?? 'BYE',
                score: awayScore,
                players: processPlayers(awayPlayers)
            },
            winner: winner,
            margin: Math.abs(homeScore - awayScore),
            total_score: homeScore + awayScore
        });
    } catch (error) {
        console.error('Error fetching detailed matchup:', error);
        return NextResponse.json({ error: 'Failed to fetch detailed matchup data' }, { status: 500 });
    }
} 