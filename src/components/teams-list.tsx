'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchJSON } from '@/lib/api';
import Link from 'next/link';

interface Team {
    team_id: number;
    team_name: string;
    wins: number;
    losses: number;
    ties: number;
    points_for: number;
    points_against: number;
}

interface TeamsData {
    standings: Team[];
    year: number;
}

export default function TeamsList() {
    const [year, setYear] = useState(new Date().getFullYear() - 1);
    const currentYear = new Date().getFullYear();

    const { data, isLoading, error } = useQuery<TeamsData>({
        queryKey: ['teams', year],
        queryFn: () => fetchJSON(`/api/league/${year}`),
    });

    const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setYear(parseInt(event.target.value, 10));
    };

    const yearOptions = [];
    for (let y = currentYear - 1; y >= 2015; y--) {
        yearOptions.push(y);
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                    <div className="text-red-600 text-2xl mb-2">⚠️</div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to load teams</h3>
                    <p className="text-red-600 text-sm">Please try refreshing the page.</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <main className="space-y-6">
            <div className="bg-gradient-to-br from-blue-900 to-purple-900 p-2 sm:p-4 rounded-lg shadow-md flex items-center justify-between text-white">
                <div>
                    <h1 className="text-2xl font-bold">Teams</h1>
                    <p className="text-purple-200">View all teams and their performance</p>
                </div>
                <div className="flex items-center space-x-4">
                    <label htmlFor="year-select" className="font-semibold">Season:</label>
                    <select 
                        id="year-select" 
                        value={year} 
                        onChange={handleYearChange} 
                        className="p-2 rounded-md bg-purple-800 text-white border border-purple-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                        {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.standings?.map((team, index) => {
                    const winPercentage = team.wins / (team.wins + team.losses + team.ties);
                    const getRecordColor = (wins: number, losses: number, ties: number) => {
                        const winPct = wins / (wins + losses + ties);
                        if (winPct >= 0.6) return 'text-green-600';
                        if (winPct >= 0.4) return 'text-yellow-600';
                        return 'text-red-600';
                    };

                    return (
                        <Link 
                            key={team.team_id} 
                            href={`/team/${team.team_id}`}
                            className="block bg-gradient-to-br from-blue-900 to-purple-900 p-2 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-purple-700 hover:border-purple-500 text-white"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">{team.team_name}</h3>
                                <div className="text-sm text-purple-200">#{team.team_id}</div>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-purple-200">Record</p>
                                    <p className={`font-semibold ${getRecordColor(team.wins, team.losses, team.ties).replace('text-yellow-600','text-yellow-300').replace('text-green-600','text-green-300').replace('text-red-600','text-red-300')}`}>
                                        {team.wins}-{team.losses}-{team.ties} ({(winPercentage * 100).toFixed(1)}%)
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-purple-200">Points For</p>
                                        <p className="font-semibold text-green-300">{team.points_for.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-purple-200">Points Against</p>
                                        <p className="font-semibold text-red-300">{team.points_against.toFixed(2)}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                    <span className="text-sm text-purple-200">Final Rank</span>
                                    <span className="text-lg font-bold text-blue-300">#{index + 1}</span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {(!data.standings || data.standings.length === 0) && (
                <div className="text-center py-12">
                    <div className="bg-purple-900/40 border border-purple-700 rounded-lg p-6 max-w-md mx-auto">
                        <div className="text-purple-200 text-2xl mb-2">📊</div>
                        <h3 className="text-lg font-semibold text-white mb-2">No teams found</h3>
                        <p className="text-purple-200 text-sm">No team data available for the selected season.</p>
                    </div>
                </div>
            )}
        </main>
    );
} 