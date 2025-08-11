'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchJSON } from '@/lib/api';
import { useParams } from 'next/navigation';

interface Player {
    id: number;
    name: string;
    position: string;
    team: string;
    points: number;
    is_starter: boolean;
    is_bench: boolean;
    is_injured: boolean;
}

interface Team {
    id: number;
    name: string;
    score: number;
    players: Player[];
}

interface DetailedMatchupData {
    year: number;
    week: number;
    is_playoff: boolean;
    home_team: Team;
    away_team: Team;
    winner: string;
    margin: number;
    total_score: number;
}

export default function DetailedMatchupPage() {
    const params = useParams();
    const year = params.year as string;
    const week = params.week as string;
    const team1 = params.team1 as string;
    const team2 = params.team2 as string;

    const { data, isLoading, error } = useQuery<DetailedMatchupData>({
        queryKey: ['detailedMatchup', year, week, team1, team2],
        queryFn: () => fetchJSON(`/api/matchups/${year}/${week}/${team1}/${team2}`),
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading matchup details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <p className="text-red-600">Failed to load matchup details.</p>
                    <p className="text-sm text-red-500 mt-2">
                        URL: /matchups/{year}/{week}/{team1}/{team2}
                    </p>
                </div>
            </div>
        );
    }

    if (!data || !data.home_team || !data.away_team) {
        return (
            <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <p className="text-yellow-600">No matchup data found.</p>
                    <p className="text-sm text-yellow-500 mt-2">
                        URL: /matchups/{year}/{week}/{team1}/{team2}
                    </p>
                </div>
            </div>
        );
    }

    const { home_team, away_team, winner, margin, total_score, is_playoff } = data;
    const homeWinner = winner === home_team.name;
    const awayWinner = winner === away_team.name;

    const renderPlayerRow = (player: Player, isHome: boolean) => (
        <tr key={player.id} className={player.is_starter ? 'bg-blue-50' : 'bg-gray-50'}>
            <td className="px-4 py-2 text-sm">
                <div className="flex items-center space-x-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${player.is_starter ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
                    <span className={player.is_injured ? 'line-through text-red-600' : ''}>
                        {player.name}
                    </span>
                </div>
            </td>
            <td className="px-4 py-2 text-sm text-center">{player.position}</td>
            <td className="px-4 py-2 text-sm text-center">{player.team}</td>
            <td className={`px-4 py-2 text-sm text-center font-mono ${player.points > 0 ? 'text-green-600' : player.points < 0 ? 'text-red-600' : ''}`}>
                {player.points.toFixed(2)}
            </td>
        </tr>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {is_playoff ? `Playoff - ${getPlayoffRound(parseInt(week))}` : `Week ${week}`} Matchup
                    </h1>
                    <span className="text-sm text-gray-500">{data.year} Season</span>
                </div>
                
                {/* Score Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`text-center p-6 rounded-lg border-2 ${homeWinner ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                        <h2 className={`text-xl font-bold ${homeWinner ? 'text-green-600' : 'text-gray-700'}`}>
                            {home_team.name}
                        </h2>
                        <div className="text-3xl font-bold mt-2">{home_team.score.toFixed(2)}</div>
                        {homeWinner && <div className="text-sm text-green-600 mt-1">WINNER</div>}
                    </div>
                    
                    <div className={`text-center p-6 rounded-lg border-2 ${awayWinner ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                        <h2 className={`text-xl font-bold ${awayWinner ? 'text-green-600' : 'text-gray-700'}`}>
                            {away_team.name}
                        </h2>
                        <div className="text-3xl font-bold mt-2">{away_team.score.toFixed(2)}</div>
                        {awayWinner && <div className="text-sm text-green-600 mt-1">WINNER</div>}
                    </div>
                </div>

                {/* Matchup Stats */}
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{total_score.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Total Points</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{margin.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Margin</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{(total_score / 2).toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Avg Score</div>
                    </div>
                </div>
            </div>

            {/* Player Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Home Team Players */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4 text-center">{home_team.name} Players</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="px-4 py-2 text-left text-sm font-semibold">Player</th>
                                    <th className="px-4 py-2 text-center text-sm font-semibold">Pos</th>
                                    <th className="px-4 py-2 text-center text-sm font-semibold">Team</th>
                                    <th className="px-4 py-2 text-center text-sm font-semibold">Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {home_team.players
                                    .sort((a, b) => b.points - a.points)
                                    .map(player => renderPlayerRow(player, true))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Away Team Players */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4 text-center">{away_team.name} Players</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="px-4 py-2 text-left text-sm font-semibold">Player</th>
                                    <th className="px-4 py-2 text-center text-sm font-semibold">Pos</th>
                                    <th className="px-4 py-2 text-center text-sm font-semibold">Team</th>
                                    <th className="px-4 py-2 text-center text-sm font-semibold">Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {away_team.players
                                    .sort((a, b) => b.points - a.points)
                                    .map(player => renderPlayerRow(player, false))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getPlayoffRound(week: number): string {
    switch (week) {
        case 15: return 'Quarter-Finals';
        case 16: return 'Semi-Finals';
        case 17: return 'Championship';
        default: return `Week ${week}`;
    }
} 