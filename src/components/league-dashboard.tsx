'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchJSON } from '@/lib/api';
import StandingsTable from '@/components/tables/standings-table';
import TeamTiersTable from '@/components/tables/team-tiers-table';
import ScoringWeeksTable from '@/components/tables/scoring-weeks-table';
import TeamRankComparisonTable from '@/components/tables/team-rank-comparison-table';
import { useEffect } from 'react';

// Define types for our new API responses
interface TeamSeasonStats {
    team_id: number;
    team: {
        team_name: string;
    };
    wins: number;
    losses: number;
    ties: number;
    points_for: number;
    points_against: number;
    actual_rank: number;
    power_rank: number;
    median_rank: number;
    combined_rank: number;
    tier: string;
}

interface LeagueRecord {
    record_type: string;
    week: number;
    team_id: number;
    value: number;
    // ... add other fields from LeagueRecord if needed
}

export default function LeagueDashboard() {
    const [year, setYear] = useState(new Date().getFullYear() - 1);
    const currentYear = new Date().getFullYear();

    const { data: standings, isLoading: isLoadingStandings } = useQuery<TeamSeasonStats[]>({
        queryKey: ['standings', year],
        queryFn: () => fetchJSON(`/api/seasons/${year}/standings`),
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });

    const { data: records, isLoading: isLoadingRecords } = useQuery<LeagueRecord[]>({
        queryKey: ['records', year],
        queryFn: () => fetchJSON(`/api/seasons/${year}/records`),
    });

    useEffect(() => {
        if (standings && standings.length > 0) {
            const sample = standings.slice(0, 5).map(s => ({
                team_id: s.team_id,
                name: s.team?.team_name,
                logo_url: s.team?.logo_url ?? null,
            }));
            console.log('[LeagueDashboard] standings logo sample', sample);
        }
    }, [standings]);

    const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setYear(parseInt(event.target.value, 10));
    };

    const yearOptions = [];
    for (let y = currentYear - 1; y >= 2015; y--) {
        yearOptions.push(y);
    }

    const isLoading = isLoadingStandings || isLoadingRecords;

    return (
        <main className="space-y-4 sm:space-y-6">
            <div className="text-white">
                <h1 className="text-lg sm:text-2xl font-bold mb-2">League Homepage</h1>
                <div className="card card--gradient p-2 sm:p-3 shadow-md inline-flex items-center">
                    <label htmlFor="year-select" className="font-semibold mr-3 text-sm sm:text-base">Select Season:</label>
                    <select id="year-select" value={year} onChange={handleYearChange} className="select text-sm">
                        {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-8 text-white">Loading dashboard...</div>
            ) : standings && records ? (
                <div className="space-y-6">
                    <div>
                        <StandingsTable standings={standings} year={year} />
                    </div>

                    {/* Team Rank Comparison just below standings */}
                    <div>
                        <TeamRankComparisonTable standings={standings} />
                    </div>

                    {/* Scoring Weeks Tables */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ScoringWeeksTable 
                            records={records} 
                            standings={standings} 
                            type="top" 
                        />
                        <ScoringWeeksTable 
                            records={records} 
                            standings={standings} 
                            type="bottom" 
                        />
                    </div>

                    {/* Team Tiers Section */}
                    <div>
                        <TeamTiersTable standings={standings} />
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-red-300">Failed to load data.</div>
            )}
        </main>
    );
}
