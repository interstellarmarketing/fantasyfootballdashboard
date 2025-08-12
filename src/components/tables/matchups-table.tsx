'use client';

import Link from 'next/link';

interface Matchup {
    id: number;
    week: number;
    is_playoff: boolean;
    home_team: string;
    home_team_id: number;
    home_team_logo?: string | null;
    home_score: number;
    away_team: string;
    away_team_id: number;
    away_team_logo?: string | null;
    away_score: number;
    winner: string;
    margin: number;
    total_score: number;
    round: string;
    detail_link: string;
}

interface MatchupsTableProps {
    matchups: Matchup[];
    title?: string;
}

export default function MatchupsTable({ matchups, title = "Matchups" }: MatchupsTableProps) {
    const getWinnerStyle = (teamName: string, winner: string) => {
        if (winner === 'Tie') return 'text-gray-500';
        return winner === teamName ? 'font-bold text-green-600' : 'text-gray-700';
    };

    const getMarginStyle = (margin: number) => {
        if (margin <= 5) return 'text-blue-600';
        if (margin <= 15) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getTotalScoreStyle = (totalScore: number) => {
        if (totalScore >= 200) return 'text-green-600 font-semibold';
        if (totalScore >= 150) return 'text-blue-600';
        if (totalScore <= 100) return 'text-red-600';
        return 'text-gray-700';
    };

    return (
        <div className="relative w-full overflow-auto card card--gradient rounded-lg shadow-lg px-2 py-4 sm:px-4 sm:py-6">
            <table className="table">
                <thead>
                    <tr>
                        <th>Round</th>
                        <th>Home Team</th>
                        <th className="text-center">Score</th>
                        <th>Away Team</th>
                        <th className="text-center">Margin</th>
                        <th className="text-center">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {matchups.map((matchup) => (
                        <tr key={matchup.id}>
                            <td className="font-medium">
                                <Link href={matchup.detail_link} className="block">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        matchup.is_playoff 
                                            ? 'bg-black/50 text-white border border-white/20' 
                                            : 'bg-black/50 text-white border border-white/20'
                                    }`}>
                                        {matchup.round}
                                    </span>
                                </Link>
                            </td>
                            <td className={`${getWinnerStyle(matchup.home_team, matchup.winner).replace('text-gray-700', 'text-white').replace('text-green-600', 'text-green-300')}`}>
                                <Link href={matchup.detail_link} className="block hover:text-gray-200">
                                    <span className="inline-flex items-center gap-2 min-w-0">
                                        {matchup.home_team_logo ? (
                                            <img src={matchup.home_team_logo} alt={`${matchup.home_team} logo`} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border border-white/20 shrink-0" />
                                        ) : (
                                            <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
                                                {matchup.home_team.charAt(0)}
                                            </span>
                                        )}
                                        <span className="break-words leading-6">{matchup.home_team}</span>
                                    </span>
                                </Link>
                            </td>
                            <td className="font-mono text-center">
                                <Link href={matchup.detail_link} className="block">
                                    {matchup.home_score.toFixed(2)}
                                </Link>
                            </td>
                            <td className={`${getWinnerStyle(matchup.away_team, matchup.winner).replace('text-gray-700', 'text-white').replace('text-green-600', 'text-green-300')}`}>
                                <Link href={matchup.detail_link} className="block hover:text-gray-200">
                                    <span className="inline-flex items-center gap-2 min-w-0">
                                        {matchup.away_team_logo ? (
                                            <img src={matchup.away_team_logo} alt={`${matchup.away_team} logo`} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border border-white/20 shrink-0" />
                                        ) : (
                                            <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
                                                {matchup.away_team.charAt(0)}
                                            </span>
                                        )}
                                        <span className="break-words leading-6">{matchup.away_team}</span>
                                    </span>
                                </Link>
                            </td>
                            <td className={`font-semibold text-center ${getMarginStyle(matchup.margin).replace('text-yellow-600','text-yellow-300').replace('text-blue-600','text-blue-300').replace('text-red-600','text-red-300')}`}>
                                <Link href={matchup.detail_link} className="block">
                                    {matchup.margin.toFixed(2)} pts
                                </Link>
                            </td>
                            <td className={`font-semibold text-center ${getTotalScoreStyle(matchup.total_score).replace('text-yellow-600','text-yellow-300').replace('text-blue-600','text-blue-300').replace('text-red-600','text-red-300').replace('text-gray-700','text-white').replace('text-green-600','text-green-300')}`}>
                                <Link href={matchup.detail_link} className="block">
                                    {matchup.total_score.toFixed(2)}
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
} 