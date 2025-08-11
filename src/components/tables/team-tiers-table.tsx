'use client';

import Link from 'next/link';

interface TeamSeasonStats {
    team_id: number;
    team: {
        team_name: string;
        logo_url?: string;
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

interface TeamTiersTableProps {
    standings: TeamSeasonStats[];
}

interface TierConfig {
    name: string;
    emoji: string;
    bgColor: string;
    textColor: string;
}

const tierConfigs: Record<string, TierConfig> = {
    'Contender': {
        name: 'Contenders',
        emoji: '💪',
        bgColor: 'bg-black',
        textColor: 'text-white'
    },
    'Mid-Tier': {
        name: 'Mid-Tier',
        emoji: '😐',
        bgColor: 'bg-black',
        textColor: 'text-white'
    },
    'Get On The Stick': {
        name: 'Get On The Stick',
        emoji: '😠',
        bgColor: 'bg-black',
        textColor: 'text-white'
    },
    'Dumpster Fire. Awful.': {
        name: 'Dumpster Fire. Awful.',
        emoji: '🦉',
        bgColor: 'bg-black',
        textColor: 'text-white'
    }
};

export default function TeamTiersTable({ standings }: TeamTiersTableProps) {
    // Group teams by tier
    const teamsByTier = standings.reduce((acc, team) => {
        const tier = team.tier;
        if (!acc[tier]) {
            acc[tier] = [];
        }
        acc[tier].push(team);
        return acc;
    }, {} as Record<string, TeamSeasonStats[]>);

    // Define tier order for consistent display
    const tierOrder = ['Contender', 'Mid-Tier', 'Get On The Stick', 'Dumpster Fire. Awful.'];

    return (
        <div className="card card--gradient px-2 py-4 sm:px-4 sm:py-6 rounded-lg shadow-lg">
            <div className="bg-indigo-900 px-3 py-3 border-b border-white/10 rounded-t-md -mx-2 sm:-mx-4 mb-2 sm:mb-3">
                <h3 className="text-white font-bold text-lg">Team Tiers</h3>
            </div>

            <div className="relative w-full overflow-auto px-2 py-2 sm:px-4 sm:py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* First three tiers in a row */}
                {tierOrder.slice(0, 3).map((tierKey) => {
                    const config = tierConfigs[tierKey];
                    const teams = teamsByTier[tierKey] || [];
                    
                    if (teams.length === 0) return null;
                    
                    return (
                        <div key={tierKey} className="space-y-3">
                            <div className={`${config.bgColor} ${config.textColor} px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold flex items-center justify-between text-[12px] sm:text-sm`}>
                                <span>{config.name}</span>
                                <span className="text-base sm:text-lg">{config.emoji}</span>
                            </div>
                            <div className="space-y-1">
                                {teams.map((team) => (
                                    <div key={team.team_id} className="text-white hover:bg-white/10 rounded px-2 py-1.5 sm:py-2 transition-colors">
                                        <Link 
                                            href={`/team/${team.team_id}`}
                                            className="block text-white hover:text-gray-200 transition-colors"
                                        >
                                            <span className="inline-flex items-center gap-2 min-w-0 text-[12px] sm:text-sm">
                                                {team.team.logo_url ? (
                                                    <img
                                                        src={team.team.logo_url}
                                                        alt={`${team.team.team_name} logo`}
                                                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-white/20 object-cover shrink-0"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center text-[11px] sm:text-sm font-bold shrink-0">
                                                        {team.team.team_name.charAt(0)}
                                                    </span>
                                                )}
                                                <span className="break-words leading-6">{team.team.team_name}</span>
                                            </span>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Fourth tier below the first column */}
            {(() => {
                const tierKey = 'Dumpster Fire. Awful.';
                const config = tierConfigs[tierKey];
                const teams = teamsByTier[tierKey] || [];
                
                if (teams.length === 0) return null;
                
                return (
                    <div className="mt-4 sm:mt-6 space-y-3">
                        <div className={`${config.bgColor} ${config.textColor} px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold flex items-center justify-between text-[12px] sm:text-sm`}>
                            <span>{config.name}</span>
                            <span className="text-base sm:text-lg">{config.emoji}</span>
                        </div>
                        <div className="space-y-1">
                            {teams.map((team) => (
                                <div key={team.team_id} className="text-white hover:bg-white/10 rounded px-2 py-1.5 sm:py-2 transition-colors">
                                    <Link 
                                        href={`/team/${team.team_id}`}
                                        className="block text-white hover:text-gray-200 transition-colors"
                                    >
                                        <span className="inline-flex items-center gap-2 min-w-0 text-[12px] sm:text-sm">
                                            {team.team.logo_url ? (
                                                <img
                                                    src={team.team.logo_url}
                                                    alt={`${team.team.team_name} logo`}
                                                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-white/20 object-cover shrink-0"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center text-[11px] sm:text-sm font-bold shrink-0">
                                                    {team.team.team_name.charAt(0)}
                                                </span>
                                            )}
                                            <span className="break-words leading-6">{team.team.team_name}</span>
                                        </span>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}
            </div>
        </div>
    );
} 