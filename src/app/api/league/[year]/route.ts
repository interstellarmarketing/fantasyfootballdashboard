import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type TeamBasics = Prisma.TeamGetPayload<{ select: { id: true; team_name: true; espn_team_id: true; wins: true; losses: true; ties: true; points_for: true; points_against: true; final_standing: true } }>

async function getLuckIndex(year: number, teams: TeamBasics[]) {
    const allScoresQuery = await prisma.matchup.findMany({
        where: { season_year: year, is_playoff: false },
        select: { week: true, home_score: true, away_score: true }
    });

    const scoresByWeek: { [week: number]: number[] } = {};
    for (const { week, home_score, away_score } of allScoresQuery) {
        if (!scoresByWeek[week]) {
            scoresByWeek[week] = [];
        }
        scoresByWeek[week].push(home_score, away_score);
    }

    const luckData = [];
    for (const team of teams) {
        let expectedWins = 0;
        const teamMatchups = await prisma.matchup.findMany({
            where: {
                season_year: year,
                is_playoff: false,
                OR: [{ home_team_id: team.id }, { away_team_id: team.id }]
            }
        });

        for (const matchup of teamMatchups) {
            const teamScore = matchup.home_team_id === team.id ? matchup.home_score : matchup.away_score;
            const allOtherScores = scoresByWeek[matchup.week] || [];
            const winsThisWeek = allOtherScores.filter(score => teamScore > score).length;
            const numOpponents = allOtherScores.length - 1;
            if (numOpponents > 0) {
                expectedWins += winsThisWeek / numOpponents;
            }
        }
        const luckIndex = team.wins - expectedWins;
        luckData.push({ team_name: team.team_name, luck_index: luckIndex });
    }

    return luckData.sort((a, b) => b.luck_index - a.luck_index);
}

async function calculatePowerStandings(year: number, teams: TeamBasics[]) {
    // Get all regular season matchups
    const matchups = await prisma.matchup.findMany({
        where: { season_year: year, is_playoff: false },
        include: { home_team: true, away_team: true }
    });

    // Group scores by week and team
    const scoresByWeekAndTeam: { [week: number]: { [teamId: number]: number } } = {};
    for (const matchup of matchups) {
        if (!scoresByWeekAndTeam[matchup.week]) {
            scoresByWeekAndTeam[matchup.week] = {};
        }
        scoresByWeekAndTeam[matchup.week][matchup.home_team_id] = matchup.home_score;
        if (matchup.away_team_id != null) {
            scoresByWeekAndTeam[matchup.week][matchup.away_team_id] = matchup.away_score;
        }
    }

    // Debug: Log team IDs and names
    console.log('Year:', year);
    console.log('Teams:', teams.map(t => ({ id: t.id, name: t.team_name, espn_id: t.espn_team_id })));
    console.log('Sample matchups:', matchups.slice(0, 3).map(m => ({
        week: m.week,
        home: { id: m.home_team_id, name: m.home_team?.team_name ?? 'TBD', score: m.home_score },
        away: { id: m.away_team_id ?? -1, name: m.away_team?.team_name ?? 'BYE', score: m.away_score }
    })));
    
    // Debug: Check if Gridiron Mandingos exists
    const gridironTeam = teams.find(t => t.team_name.includes('Gridiron') || t.team_name.includes('Mandingo'));
    if (gridironTeam) {
        console.log('Found Gridiron team:', gridironTeam);
    } else {
        console.log('Gridiron Mandingos not found in teams');
    }

    // Calculate power standings (if every team played every other team every week)
    const powerStandings = [];
    for (const team of teams) {
        let powerWins = 0;
        let powerGames = 0;

        // For each week, calculate how many teams this team would have beaten
        for (const week in scoresByWeekAndTeam) {
            const teamScore = scoresByWeekAndTeam[parseInt(week)][team.id];
            if (teamScore !== undefined) {
                const weeklyScores = Object.values(scoresByWeekAndTeam[parseInt(week)]);
                
                // Count how many teams this team would have beaten this week
                // Create a copy of scores and remove only one instance of the team's score
                const otherScores = [...weeklyScores];
                const teamScoreIndex = otherScores.indexOf(teamScore);
                if (teamScoreIndex !== -1) {
                    otherScores.splice(teamScoreIndex, 1);
                }
                
                const winsThisWeek = otherScores.filter(score => teamScore > score).length;
                powerWins += winsThisWeek;
                powerGames += otherScores.length;
            }
        }

        // Debug logging for Gridiron Mandingos
        if (team.team_name.includes('Gridiron Mandingo')) {
            console.log(`Power standings for ${team.team_name}:`);
            console.log(`Total power wins: ${powerWins}`);
            console.log(`Total power games: ${powerGames}`);
            console.log(`Power record: ${powerWins}-${powerGames - powerWins}`);
            
            // Debug: Show a few weeks of calculations
            console.log('Sample weekly calculations:');
            Object.keys(scoresByWeekAndTeam).slice(0, 3).forEach(week => {
                const teamScore = scoresByWeekAndTeam[parseInt(week)][team.id];
                if (teamScore !== undefined) {
                    const weeklyScores = Object.values(scoresByWeekAndTeam[parseInt(week)]);
                    const otherScores = [...weeklyScores];
                    const teamScoreIndex = otherScores.indexOf(teamScore);
                    if (teamScoreIndex !== -1) {
                        otherScores.splice(teamScoreIndex, 1);
                    }
                    const winsThisWeek = otherScores.filter(score => teamScore > score).length;
                    console.log(`Week ${week}: Team score ${teamScore}, beat ${winsThisWeek}/${otherScores.length} teams`);
                }
            });
        }

        powerStandings.push({
            team_id: team.espn_team_id,
            team_name: team.team_name,
            wins: powerWins,
            losses: powerGames - powerWins,
            ties: 0,
            points_for: team.points_for,
            points_against: team.points_against,
            win_percentage: powerGames > 0 ? powerWins / powerGames : 0
        });
    }

    return powerStandings.sort((a, b) => b.win_percentage - a.win_percentage);
}

async function calculateMedianStandings(year: number, teams: TeamBasics[]) {
    // Get all regular season matchups
    const matchups = await prisma.matchup.findMany({
        where: { season_year: year, is_playoff: false },
        include: { home_team: true, away_team: true }
    });

    // Group scores by week and team
    const scoresByWeekAndTeam: { [week: number]: { [teamId: number]: number } } = {};
    for (const matchup of matchups) {
        if (!scoresByWeekAndTeam[matchup.week]) {
            scoresByWeekAndTeam[matchup.week] = {};
        }
        scoresByWeekAndTeam[matchup.week][matchup.home_team_id] = matchup.home_score;
        if (matchup.away_team_id != null) {
            scoresByWeekAndTeam[matchup.week][matchup.away_team_id] = matchup.away_score;
        }
    }

    // Calculate median scores for each week
    const medianByWeek: { [week: number]: number } = {};
    for (const week in scoresByWeekAndTeam) {
        const scores = Object.values(scoresByWeekAndTeam[parseInt(week)]).sort((a, b) => a - b);
        const mid = Math.floor(scores.length / 2);
        medianByWeek[parseInt(week)] = scores.length % 2 === 0 
            ? (scores[mid - 1] + scores[mid]) / 2 
            : scores[mid];
    }

    // Calculate median standings (wins/losses against median score each week)
    const medianStandings = [];
    for (const team of teams) {
        let medianWins = 0;
        let medianGames = 0;

        // For each week, check if team beat the median
        for (const week in medianByWeek) {
            const teamScore = scoresByWeekAndTeam[parseInt(week)][team.id];
            if (teamScore !== undefined) {
                const medianScore = medianByWeek[parseInt(week)];
                
                if (teamScore > medianScore) {
                    medianWins++;
                }
                medianGames++;
            }
        }

        medianStandings.push({
            team_id: team.espn_team_id,
            team_name: team.team_name,
            wins: medianWins,
            losses: medianGames - medianWins,
            ties: 0,
            points_for: team.points_for,
            points_against: team.points_against,
            win_percentage: medianGames > 0 ? medianWins / medianGames : 0
        });
    }

    return medianStandings.sort((a, b) => b.win_percentage - a.win_percentage);
}

async function calculateCombinedStandings(year: number, teams: TeamBasics[]) {
    // Get actual standings
    const actualStandings = teams.map(t => ({
        team_id: t.espn_team_id,
        team_name: t.team_name,
        wins: t.wins,
        losses: t.losses,
        ties: t.ties,
        points_for: t.points_for,
        points_against: t.points_against,
        win_percentage: t.wins / (t.wins + t.losses + t.ties)
    })).sort((a, b) => {
        if (a.wins !== b.wins) return b.wins - a.wins;
        if (a.losses !== b.losses) return a.losses - b.losses;
        return b.points_for - a.points_for;
    });

    // Get median standings
    const medianStandings = await calculateMedianStandings(year, teams);

    // Combine actual and median standings
    const combinedStandings = [];
    for (const team of teams) {
        const actualTeam = actualStandings.find(t => t.team_id === team.espn_team_id);
        const medianTeam = medianStandings.find(t => t.team_id === team.espn_team_id);
        
        const combinedWins = (actualTeam?.wins || 0) + (medianTeam?.wins || 0);
        const combinedLosses = (actualTeam?.losses || 0) + (medianTeam?.losses || 0);
        const totalGames = combinedWins + combinedLosses;
        
        combinedStandings.push({
            team_id: team.espn_team_id,
            team_name: team.team_name,
            wins: combinedWins,
            losses: combinedLosses,
            ties: 0,
            points_for: team.points_for,
            points_against: team.points_against,
            win_percentage: totalGames > 0 ? combinedWins / totalGames : 0
        });
    }

    return combinedStandings.sort((a, b) => b.win_percentage - a.win_percentage);
}

async function getPlayoffBracket(year: number, teams: TeamBasics[]) {
    const teamIdMap = new Map(teams.map(team => [team.id, { name: team.team_name, seed: team.final_standing, espn_team_id: team.espn_team_id }]));

    const playoffMatchups = await prisma.matchup.findMany({
        where: { season_year: year, is_playoff: true },
        orderBy: { week: 'asc' },
        include: { home_team: true, away_team: true }
    });

    const winnersByWeek: { [week: number]: Prisma.MatchupGetPayload<{ include: { home_team: true; away_team: true } }>[] } = {};
    for (const matchup of playoffMatchups) {
        if (!winnersByWeek[matchup.week]) {
            winnersByWeek[matchup.week] = [];
        }
        winnersByWeek[matchup.week].push(matchup);
    }

    const bracket: { rounds: { [key: string]: Array<{ home_team: string; home_score: number; away_team: string; away_score: number; winner: string; link: string }> } } = { rounds: {} };
    if (Object.keys(winnersByWeek).length === 0) {
        return bracket;
    }

    const processMatchup = (m: Prisma.MatchupGetPayload<{ include: { home_team: true; away_team: true } }>) => {
        const hInfo = teamIdMap.get(m.home_team_id);
        const aInfo = m.away_team_id != null ? teamIdMap.get(m.away_team_id) : undefined;
        const hName = hInfo ? `(${hInfo.seed}) ${hInfo.name}` : "TBD";
        const aName = aInfo ? `(${aInfo.seed}) ${aInfo.name}` : "TBD";
        const winner = m.home_score > m.away_score ? hName : (m.away_score > m.home_score ? aName : "TBD");
        return {
            home_team: hName,
            home_score: m.home_score,
            away_team: aName,
            away_score: m.away_score,
            winner: winner,
            link: `/matchups/${year}/${m.week}/${m.home_team_id}/${m.away_team_id ?? ''}`
        };
    };

    // Get the playoff weeks in order
    const weeks = Object.keys(winnersByWeek).map(Number).sort((a, b) => a - b);
    
    // Determine round names based on the number of playoff weeks and their typical structure
    // Most fantasy leagues have 3 playoff weeks: Quarter-Finals (week 14), Semi-Finals (week 15), Championship (week 16)
    // But some might have different structures
    let roundNames: string[] = [];
    
    if (weeks.length === 1) {
        roundNames = ['Championship'];
    } else if (weeks.length === 2) {
        roundNames = ['Semi-Finals', 'Championship'];
    } else if (weeks.length === 3) {
        roundNames = ['Quarter-Finals', 'Semi-Finals', 'Championship'];
    } else if (weeks.length === 4) {
        // Some leagues might have a wild card round
        roundNames = ['Wild Card', 'Quarter-Finals', 'Semi-Finals', 'Championship'];
    } else {
        // Fallback: use week numbers as round names
        roundNames = weeks.map(week => `Week ${week}`);
    }

    // Assign matchups to rounds
    for (let i = 0; i < weeks.length; i++) {
        const week = weeks[i];
        const roundName = roundNames[i];
        bracket.rounds[roundName] = winnersByWeek[week].map(processMatchup);
    }

    return bracket;
}


export async function GET(
    req: Request,
    context: unknown
) {
    const { params } = context as { params: { year: string } };
    const year = parseInt(params.year, 10);

    const season = await prisma.season.findUnique({
        where: { year },
    });

    if (!season) {
        return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    // Debug: Check available years
    const availableYears = await prisma.season.findMany({
        select: { year: true }
    });
    console.log('Available years:', availableYears.map(y => y.year));

    const teams = await prisma.team.findMany({
        where: { season_year: year },
        orderBy: { final_standing: 'asc' },
    });

    if (!teams || teams.length === 0) {
        return NextResponse.json({ error: "No teams found" }, { status: 404 });
    }

    const luck = await getLuckIndex(year, teams);
    const bracket = await getPlayoffBracket(year, teams);

    // Calculate different standings types
    const actualStandings = teams.map(t => ({
        team_id: t.espn_team_id,
        team_name: t.team_name,
        wins: t.wins,
        losses: t.losses,
        ties: t.ties,
        points_for: t.points_for,
        points_against: t.points_against,
    }));

    const powerStandings = await calculatePowerStandings(year, teams);
    const medianStandings = await calculateMedianStandings(year, teams);
    const combinedStandings = await calculateCombinedStandings(year, teams);

    const data = {
        year: year,
        settings: { name: season.league_name },
        teams: teams.map(t => t.team_name),
        standings: actualStandings,
        power_standings: powerStandings,
        median_standings: medianStandings,
        combined_standings: combinedStandings,
        awards: { luck_index: luck },
        playoff_bracket: bracket,
    };

    return NextResponse.json(data);
}
