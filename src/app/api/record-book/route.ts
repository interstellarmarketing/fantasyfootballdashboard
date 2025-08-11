import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Get all valid regular-season matchups for analysis
        // Exclude BYE entries and any rows without both teams
        const matchups = await prisma.matchup.findMany({
            where: {
                NOT: { is_bye: true }
            },
            include: {
                home_team: true,
                away_team: true
            },
            orderBy: { season_year: 'desc' }
        });

        // Calculate records
        const records = {
            shootouts: [],
            snoozers: [],
            blowouts: [],
            nailbiters: [],
            top_scores: [],
            low_scores: []
        };

        for (const matchup of matchups) {
            // Safety: skip any malformed rows lacking a home or away team
            if (!matchup.home_team || !matchup.away_team) continue;
            // Skip placeholder rows with no scores recorded
            if ((matchup.home_score ?? 0) === 0 && (matchup.away_score ?? 0) === 0) continue;
            
            const combinedScore = matchup.home_score + matchup.away_score;
            const margin = Math.abs(matchup.home_score - matchup.away_score);
            const matchupName = `${matchup.home_team.team_name} vs ${matchup.away_team.team_name}`;

            // Shootouts (highest combined scores)
            records.shootouts.push({
                matchup: matchupName,
                year: matchup.season_year,
                value: combinedScore,
                score: `${matchup.home_score.toFixed(2)} - ${matchup.away_score.toFixed(2)}`
            });

            // Snoozers (lowest combined scores)
            records.snoozers.push({
                matchup: matchupName,
                year: matchup.season_year,
                value: combinedScore,
                score: `${matchup.home_score.toFixed(2)} - ${matchup.away_score.toFixed(2)}`
            });

            // Blowouts (biggest margins)
            records.blowouts.push({
                matchup: matchupName,
                year: matchup.season_year,
                value: margin,
                margin: `${margin.toFixed(2)} pts`
            });

            // Nailbiters (closest games: exclude ties, i.e., margin must be > 0)
            if (margin > 0) {
                records.nailbiters.push({
                    matchup: matchupName,
                    year: matchup.season_year,
                    value: margin,
                    margin: `${margin.toFixed(2)} pts`
                });
            }

            // Individual scores
            records.top_scores.push({
                team: matchup.home_team.team_name,
                year: matchup.season_year,
                value: matchup.home_score
            });
            records.top_scores.push({
                team: matchup.away_team.team_name,
                year: matchup.season_year,
                value: matchup.away_score
            });

            records.low_scores.push({
                team: matchup.home_team.team_name,
                year: matchup.season_year,
                value: matchup.home_score
            });
            records.low_scores.push({
                team: matchup.away_team.team_name,
                year: matchup.season_year,
                value: matchup.away_score
            });
        }

        // Sort and take top 10 for each category
        const sortedRecords = {
            shootouts: records.shootouts
                .sort((a, b) => b.value - a.value)
                .slice(0, 10)
                .map((record, index) => ({ ...record, rank: index + 1 })),
            snoozers: records.snoozers
                .sort((a, b) => a.value - b.value)
                .slice(0, 10)
                .map((record, index) => ({ ...record, rank: index + 1 })),
            blowouts: records.blowouts
                .sort((a, b) => b.value - a.value)
                .slice(0, 10)
                .map((record, index) => ({ ...record, rank: index + 1 })),
            nailbiters: records.nailbiters
                .sort((a, b) => a.value - b.value)
                .slice(0, 10)
                .map((record, index) => ({ ...record, rank: index + 1 })),
            top_scores: records.top_scores
                .sort((a, b) => b.value - a.value)
                .slice(0, 10)
                .map((record, index) => ({ ...record, rank: index + 1 })),
            low_scores: records.low_scores
                .sort((a, b) => a.value - b.value)
                .slice(0, 10)
                .map((record, index) => ({ ...record, rank: index + 1 }))
        };

        return NextResponse.json(sortedRecords);
    } catch (error) {
        console.error('Error fetching record book:', error);
        return NextResponse.json({ error: 'Failed to fetch record book data' }, { status: 500 });
    }
} 