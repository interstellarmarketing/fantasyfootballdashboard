'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchJSON } from '@/lib/api';

// Define types for the data
interface Season {
    year: number;
    team_name: string;
    record: string;
    all_play_record: string;
    points_for: number;
    points_for_avg: number;
    points_vs: number;
    points_vs_avg: number;
    luck: number;
    sos: number;
    season_score: number;
    rank: number;
    trophy: string;
}

interface Summary {
    record: string;
    points_for: number;
    playoff_appearances: number;
    championships: number;
}

interface TeamHistoryData {
    team_name: string;
    owner_name: string;
    summary: Summary;
    season_history: Season[];
}

interface TeamHistoryProps {
    teamId: string;
}

export default function TeamHistory({ teamId }: TeamHistoryProps) {
    const [sortKey, setSortKey] = useState('year');

    const { data, isLoading, error } = useQuery<TeamHistoryData>({
        queryKey: ['teamHistory', teamId],
        queryFn: () => fetchJSON(`/api/teams/history/${teamId}`),
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
    });

    // Memoize sorted history to prevent unnecessary re-renders
    const sortedHistory = useMemo(() => {
        if (!data?.season_history) return [];
        
        return [...data.season_history].sort((a, b) => {
            if (sortKey === 'rank') {
                return a[sortKey] - b[sortKey];
            }
            return b[sortKey] - a[sortKey];
        });
    }, [data?.season_history, sortKey]);

    // Memoize quick stats calculations
    const quickStats = useMemo(() => {
        if (!data?.season_history) return null;
        
        const history = data.season_history;
        return {
            bestSeasonScore: Math.max(...history.map(s => s.season_score)),
            bestRank: Math.min(...history.map(s => s.rank)),
            mostPoints: Math.max(...history.map(s => s.points_for)),
            avgLuck: history.reduce((sum, s) => sum + s.luck, 0) / history.length
        };
    }, [data?.season_history]);

    const handleSortChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        setSortKey(event.target.value);
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow-md border border-blue-100">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="h-10 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
                            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </div>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-gray-100 p-4 rounded-lg border animate-pulse">
                                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                <div className="h-6 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
                    <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 space-y-4 md:space-y-0">
                        <div>
                            <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                            <div className="h-8 bg-gray-200 rounded w-24"></div>
                        </div>
                    </div>
                    
                    <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="text-center">
                                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                <div className="h-6 bg-gray-200 rounded mb-1"></div>
                                <div className="h-3 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 bg-gray-200 rounded"></div>
                            ))}
                        </div>
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
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to load team history</h3>
                    <p className="text-red-600 text-sm">Please try refreshing the page or contact support if the problem persists.</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            {/* Enhanced Header Card */}
            <div className="card card--gradient p-6 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">{data.team_name}</h1>
                        <p className="text-xl text-purple-200">Managed by {data.owner_name}</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <span className="badge"><span className="text-sm font-medium">Team ID: {teamId}</span></span>
                    </div>
                </div>
                
                {/* Enhanced Summary Stats */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SummaryStat 
                        title="Career Record" 
                        value={data.summary.record}
                        icon="📊"
                        color="blue"
                    />
                    <SummaryStat 
                        title="Total Points For" 
                        value={data.summary.points_for.toFixed(2)}
                        icon="⚡"
                        color="green"
                    />
                    <SummaryStat 
                        title="Playoff Appearances" 
                        value={data.summary.playoff_appearances}
                        icon="🏆"
                        color="purple"
                    />
                    <SummaryStat 
                        title="Championships" 
                        value={`${data.summary.championships} 🏆`}
                        icon="👑"
                        color="yellow"
                    />
                </div>
            </div>

            {/* Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card card--gradient p-6 shadow-md">
                    <h3 className="text-lg font-semibold text-white mb-4">Season Score Trend</h3>
                    <PerformanceChart 
                        data={sortedHistory}
                        metric="season_score"
                        color="blue"
                        label="Season Score"
                    />
                </div>
                <div className="card card--gradient p-6 shadow-md">
                    <h3 className="text-lg font-semibold text-white mb-4">Points For Trend</h3>
                    <PerformanceChart 
                        data={sortedHistory}
                        metric="points_for"
                        color="green"
                        label="Points For"
                    />
                </div>
            </div>

            {/* Enhanced Season History */}
            <div className="card card--gradient p-6 shadow-md">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 space-y-4 md:space-y-0">
                    <div>
                        <h2 className="text-xl md:text-2xl font-semibold text-white">Season History</h2>
                        <p className="text-sm text-purple-200 mt-1">
                            {data.season_history.length} seasons of data available
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <label htmlFor="sort-select" className="text-sm font-medium text-purple-200">Sort By:</label>
                        <select 
                            id="sort-select" 
                            value={sortKey} 
                            onChange={handleSortChange} 
                            className="select"
                        >
                            <option value="year">Season</option>
                            <option value="season_score">Season Score</option>
                            <option value="rank">Rank</option>
                            <option value="luck">Luck</option>
                        </select>
                    </div>
                </div>
                
                {/* Quick Stats Row */}
                {quickStats && (
                    <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-purple-800/40 rounded-lg">
                        <QuickStat 
                            label="Best Season"
                            value={quickStats.bestSeasonScore.toFixed(2)}
                            subtitle="Season Score"
                        />
                        <QuickStat 
                            label="Best Rank"
                            value={quickStats.bestRank}
                            subtitle="Final Standing"
                        />
                        <QuickStat 
                            label="Most Points"
                            value={quickStats.mostPoints.toFixed(2)}
                            subtitle="Single Season"
                        />
                        <QuickStat 
                            label="Avg Luck"
                            value={quickStats.avgLuck.toFixed(2)}
                            subtitle="Career Average"
                        />
                    </div>
                )}

                <div className="relative w-full overflow-auto px-2 py-2 sm:px-4 sm:py-4">
                    <HistoryTable history={sortedHistory} />
                </div>
            </div>
        </div>
    );
}

function PerformanceChart({ 
    data, 
    metric, 
    color, 
    label 
}: { 
    data: Season[]; 
    metric: keyof Season; 
    color: string; 
    label: string;
}) {
    const sortedData = [...data].sort((a, b) => a.year - b.year);
    const maxValue = Math.max(...sortedData.map(d => d[metric] as number));
    const minValue = Math.min(...sortedData.map(d => d[metric] as number));
    const range = maxValue - minValue;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Min: {minValue.toFixed(2)}</span>
                <span>Max: {maxValue.toFixed(2)}</span>
            </div>
            <div className="relative h-32">
                <svg className="w-full h-full" viewBox={`0 0 ${sortedData.length * 60} 128`}>
                    <polyline
                        fill="none"
                        stroke={color === 'blue' ? '#3B82F6' : '#10B981'}
                        strokeWidth="2"
                        points={sortedData.map((d, i) => {
                            const x = i * 60 + 30;
                            const y = 128 - ((d[metric] as number - minValue) / range) * 100;
                            return `${x},${y}`;
                        }).join(' ')}
                    />
                    {sortedData.map((d, i) => {
                        const x = i * 60 + 30;
                        const y = 128 - ((d[metric] as number - minValue) / range) * 100;
                        return (
                            <circle
                                key={d.year}
                                cx={x}
                                cy={y}
                                r="4"
                                fill={color === 'blue' ? '#3B82F6' : '#10B981'}
                            />
                        );
                    })}
                </svg>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
                {sortedData.map(d => (
                    <span key={d.year} className="transform -rotate-45 origin-left">
                        {d.year}
                    </span>
                ))}
            </div>
        </div>
    );
}

function SummaryStat({ title, value, icon, color }: { 
    title: string; 
    value: string | number; 
    icon: string;
    color: 'blue' | 'green' | 'purple' | 'yellow';
}) {
    const colorClasses = {
        blue: 'bg-blue-50 border-blue-200',
        green: 'bg-green-50 border-green-200',
        purple: 'bg-purple-50 border-purple-200',
        yellow: 'bg-yellow-50 border-yellow-200'
    };

    return (
        <div className={`p-4 rounded-lg border ${colorClasses[color]} transition-transform hover:scale-105`}>
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm text-gray-600 font-medium">{title}</h4>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
                <span className="text-2xl">{icon}</span>
            </div>
        </div>
    );
}

function QuickStat({ label, value, subtitle }: { 
    label: string; 
    value: string | number; 
    subtitle: string;
}) {
    return (
        <div className="text-center">
            <div className="text-sm text-gray-500 font-medium">{label}</div>
            <div className="text-lg font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400">{subtitle}</div>
        </div>
    );
}

function HistoryTable({ history }: { history: Season[] }) {
    const headers = ['Season', 'Team', 'Record', 'All-Play', 'Points (Avg)', 'Points Vs (Avg)', 'Luck', 'SOS', 'Season Score', 'Rank'];

    return (
        <table className="table">
            <thead>
                <tr>
                    {headers.map(h => (
                        <th key={h}>{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {history.map((season) => (
                    <tr key={season.year}>
                        <td className="font-bold">{season.year}</td>
                        <td>{season.team_name}</td>
                        <td>{season.record}</td>
                        <td className="text-white/70">{season.all_play_record}</td>
                        <td>
                            {season.points_for.toFixed(2)} ({season.points_for_avg.toFixed(2)})
                        </td>
                        <td>
                            {season.points_vs.toFixed(2)} ({season.points_vs_avg.toFixed(2)})
                        </td>
                        <td className={season.luck > 0 ? 'text-green-300 font-semibold' : 'text-red-300 font-semibold'}>
                            {season.luck > 0 ? '+' : ''}{season.luck.toFixed(2)}
                        </td>
                        <td className="text-white/70">{season.sos.toFixed(2)}</td>
                        <td className="font-bold text-blue-300">{season.season_score.toFixed(2)}</td>
                        <td className="text-lg font-bold text-center">
                            {season.rank}{season.trophy}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
