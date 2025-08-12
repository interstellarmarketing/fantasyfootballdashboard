'use client';

import Link from 'next/link';

interface LeagueRecord {
    record_type: string;
    week: number;
    team_id: number;
    value: number;
}

interface TeamSeasonStats {
    team_id: number;
    team: {
        team_name: string;
        logo_url?: string;
    };
}

interface ScoringWeeksTableProps {
    records: LeagueRecord[];
    standings: TeamSeasonStats[];
    type: 'top' | 'bottom';
}

export default function ScoringWeeksTable({ records, standings, type }: ScoringWeeksTableProps) {
    const isTop = type === 'top';
    const title = isTop ? 'Top 5 Scoring Weeks' : 'Bottom 5 Scoring Weeks';
    const emoji = isTop ? '🚀' : '😮';
    const recordType = isTop ? 'highest_score' : 'lowest_score';
    
    // Filter and sort records
    const filteredRecords = records
        .filter(r => r.record_type === recordType)
        .slice(0, 5)
        .map(record => {
            const team = standings.find(s => s.team_id === record.team_id);
            return {
                ...record,
                team_name: team?.team.team_name || 'Unknown Team',
                team_logo: team?.team.logo_url || null,
                team_id: record.team_id
            };
        });

    // Sort by value (descending for top, ascending for bottom)
    const sortedRecords = isTop 
        ? filteredRecords.sort((a, b) => b.value - a.value)
        : filteredRecords.sort((a, b) => a.value - b.value);

    return (
        <div className="card card--gradient rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="card-header">
                <h3 className="text-white font-bold text-lg flex items-center">
                    {title}
                    <span className="ml-2 text-xl">{emoji}</span>
                </h3>
            </div>
            
            {/* Table */}
            <div className="relative w-full overflow-auto px-2 py-2 sm:px-4 sm:py-4">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Team</th>
                            <th className="text-center">Week</th>
                            <th className="text-center">Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRecords.map((record) => (
                            <tr key={`${record.team_id}-${record.week}`}>
                                <td>
                                    <Link 
                                        href={`/team/${record.team_id}`}
                                        className="flex items-center gap-2 hover:text-gray-200 transition-colors min-w-0"
                                    >
                                        {record.team_logo ? (
                                            <img
                                                src={record.team_logo}
                                                alt={`${record.team_name} logo`}
                                                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border border-white/20 shrink-0"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center text-xs sm:text-sm font-bold text-white shrink-0">
                                                {record.team_name.charAt(0)}
                                            </div>
                                        )}
                                        <span className="break-words leading-6">{record.team_name}</span>
                                    </Link>
                                </td>
                                <td className="text-center">
                                    {record.week}
                                </td>
                                <td className="font-medium text-center">
                                    {record.value.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
} 