'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Info } from 'lucide-react';

// Updated interface to match the new API response
interface TeamSeasonStats {
    team_id: number;
    team: {
        team_name: string;
        final_standing?: number;
        espn_team_id: number;
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
    power_wins: number;
    power_losses: number;
    power_ties: number;
    median_wins: number;
    median_losses: number;
    median_ties: number;
    combined_wins: number;
    combined_losses: number;
    combined_ties: number;
    tier: string;
}

interface StandingsTableProps {
    standings: TeamSeasonStats[];
    year: number;
    showPointsAgainst?: boolean;
}

type StandingsType = 'actual' | 'power' | 'median' | 'combined';

export default function StandingsTable({ 
    standings, 
    year, 
    showPointsAgainst = true 
}: StandingsTableProps) {
    const [activeTab, setActiveTab] = useState<StandingsType>('actual');
    const [showInfoModal, setShowInfoModal] = useState(false);

    // Debug: log a sample of logo URLs to verify presence from API
    useEffect(() => {
        if (standings && standings.length > 0) {
            const sample = standings.slice(0, 5).map(t => ({
                team_id: t.team_id,
                name: t.team.team_name,
                logo_url: t.team.logo_url ?? null,
            }));
            console.log('[StandingsTable] logo sample', sample);
        }
    }, [standings]);

    const getStandingsData = (): TeamSeasonStats[] => {
        const sortedStandings = [...standings];
        switch (activeTab) {
            case 'actual':
                return sortedStandings.sort((a, b) => a.actual_rank - b.actual_rank);
            case 'power':
                return sortedStandings.sort((a, b) => a.power_rank - b.power_rank);
            case 'median':
                return sortedStandings.sort((a, b) => a.median_rank - b.median_rank);
            case 'combined':
                return sortedStandings.sort((a, b) => a.combined_rank - b.combined_rank);
            default:
                return sortedStandings.sort((a, b) => a.actual_rank - b.actual_rank);
        }
    };

    // Colors are unified by the surrounding dark theme; per-row text colors are simplified

    const getRecordForTab = (team: TeamSeasonStats, tab: StandingsType) => {
        console.log('Team data:', team);
        console.log('Active tab:', tab);
        
        switch (tab) {
            case 'actual':
                return { wins: team.wins || 0, losses: team.losses || 0, ties: team.ties || 0 };
            case 'power':
                const powerRecord = { 
                    wins: team.power_wins || 0, 
                    losses: team.power_losses || 0, 
                    ties: team.power_ties || 0 
                };
                console.log('Power record:', powerRecord);
                return powerRecord;
            case 'median':
                const medianRecord = { 
                    wins: team.median_wins || 0, 
                    losses: team.median_losses || 0, 
                    ties: team.median_ties || 0 
                };
                console.log('Median record:', medianRecord);
                return medianRecord;
            case 'combined':
                const combinedRecord = { 
                    wins: team.combined_wins || 0, 
                    losses: team.combined_losses || 0, 
                    ties: team.combined_ties || 0 
                };
                console.log('Combined record:', combinedRecord);
                return combinedRecord;
            default:
                return { wins: team.wins || 0, losses: team.losses || 0, ties: team.ties || 0 };
        }
    };

    // Points coloring is intentionally neutral on dark theme

    const standingsData = getStandingsData();

    return (
        <div className="card card--gradient px-2 py-4 sm:px-4 sm:py-6 shadow-lg">
            {/* Header with tabs */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base sm:text-lg font-semibold text-white">League Standings — {year}</h3>
                <button
                    onClick={() => setShowInfoModal(true)}
                    className="btn--icon"
                    title="Standings Categories Info"
                >
                    <Info className="w-5 h-5 text-purple-200" />
                </button>
            </div>

            {/* Tabs (no horizontal scrollbar; equal-width grid) */}
            <div className="mb-3 w-full">
                <div className="grid w-full grid-cols-4 items-center justify-center rounded-lg bg-gray-600/50 p-0 text-gray-300">
                    {[
                        { key: 'actual', label: 'Actual', icon: '🏆' },
                        { key: 'power', label: 'Power', icon: '∞' },
                        { key: 'median', label: 'Median', icon: '⊙' },
                        { key: 'combined', label: 'Combined', icon: 'Σ' }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as StandingsType)}
                            className={`btn btn--tab flex items-center gap-2 ${
                                activeTab === tab.key ? 'bg-indigo-600 text-white shadow-sm' : ''
                            }`}
                        >
                            <span className="text-base">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="relative w-full overflow-auto rounded-lg">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Team</th>
                            <th className="text-center">Actual Record</th>
                            <th className="text-center">PF</th>
                            {showPointsAgainst && (
                                <th className="text-center">PA</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {standingsData.map((team, index) => {
                            const record = getRecordForTab(team, activeTab);
                            const totalGames = record.wins + record.losses + record.ties;
                            const winPercentage = totalGames > 0 ? record.wins / totalGames : 0;

                            return (
                                <tr key={team.team_id}>
                                    <td className="text-center font-medium">
                                        {index + 1}
                                    </td>
                                    <td className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Link 
                                                href={`/team/${team.team.espn_team_id}`}
                                                className="flex items-center gap-2 min-w-0 flex-1 hover:text-gray-200 transition-colors"
                                            >
                                                {team.team.logo_url ? (
                                                    <img
                                                        src={team.team.logo_url}
                                                        alt={`${team.team.team_name} logo`}
                                                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border border-white/20 shrink-0"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-[11px] sm:text-sm font-bold shrink-0">
                                                        {team.team.team_name.charAt(0)}
                                                    </div>
                                                )}
                                                <span className="break-words leading-6">{team.team.team_name}</span>
                                            </Link>
                                            {team.team.final_standing === 1 && (
                                                <span className="shrink-0" title="League Champion">🏆</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="text-center font-medium">
                                        {record.wins}-{record.losses}-{record.ties}
                                    </td>
                                    <td className="text-center">
                                        {team.points_for.toFixed(1)}
                                    </td>
                                    {showPointsAgainst && (
                                        <td className="text-center">
                                            {team.points_against.toFixed(1)}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Info Modal */}
            {showInfoModal && (
                <div className="modal-overlay">
                    <div className="modal max-w-xl w-full mx-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-semibold">Standings Categories</h3>
                            <button
                                onClick={() => setShowInfoModal(false)}
                                className="w-8 h-8 rounded-full bg-purple-800 hover:bg-purple-700 flex items-center justify-center transition-colors"
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                        <p className="text-purple-200 mb-4">Explanation of different standings views</p>

                        <div className="space-y-5">
                            <div>
                                <div className="font-semibold text-white flex items-center gap-2">Actual <span>🏆</span></div>
                                <p className="text-purple-200">Based on wins and losses against your weekly opponent.</p>
                            </div>
                            <hr className="border-white/10" />
                            <div>
                                <div className="font-semibold text-white flex items-center gap-2">Power <span>💪</span></div>
                                <p className="text-purple-200">If every team played every other team every week. In a 10 team league, every team has 9 games each week.</p>
                            </div>
                            <hr className="border-white/10" />
                            <div>
                                <div className="font-semibold text-white flex items-center gap-2">Median <span>⊙</span></div>
                                <p className="text-purple-200">Win/loss record against the median score each week. Takes matchup luck out of the equation.</p>
                            </div>
                            <hr className="border-white/10" />
                            <div>
                                <div className="font-semibold text-white flex items-center gap-2">Combined <span>Σ</span></div>
                                <p className="text-purple-200">Sum of actual wins and median wins. You play your opponent, but also one additional game against the median score. Some matchup luck, but less than only playing your opponent.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
