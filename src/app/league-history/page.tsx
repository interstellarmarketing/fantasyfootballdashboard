'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchJSON } from '@/lib/api';
import NotableGamesTable from '@/components/tables/notable-games-table';

interface LeagueHistoryData {
  all_time_standings: Array<{
    team_name: string;
    owner_name: string;
    original_team_name: string;
    record: string;
    win_pct: string;
    league_rating: number;
    championships: number;
    runner_ups: number;
    third_places: number;
    trophies: string;
    seasons_played: number;
  }>;
}

interface NotableGamesData {
  best_games: any[];
  worst_games: any[];
  brutal_losses: any[];
  pathetic_wins: any[];
}

export default function LeagueHistoryPage() {
  const { data, isLoading, error } = useQuery<LeagueHistoryData>({
    queryKey: ['leagueHistory'],
    queryFn: () => fetchJSON('/api/league-history'),
  });

  const { data: notable } = useQuery<NotableGamesData>({
    queryKey: ['notableGames'],
    queryFn: () => fetchJSON('/api/league-history/notable-games'),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">League History</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-purple-200">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">League History</h1>
        </div>
        <div className="bg-red-900/40 border border-red-700 rounded-lg p-6">
          <p className="text-red-200">Failed to load league history data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">League History</h1>
      </div>
      
      {data && (
        <>
          <div className="card card--gradient px-2 py-4 sm:px-4 sm:py-6 shadow-md rounded-lg">
            <div className="card-header">
              <h2 className="text-white font-bold text-lg">All-Time Franchise Rankings</h2>
            </div>
            <div className="relative w-full overflow-auto px-2 py-2 sm:px-4 sm:py-4">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Team</th>
                    <th>Owner</th>
                    <th className="text-center">Record</th>
                    <th className="text-center">Win %</th>
                    <th className="text-center">Seasons</th>
                    <th className="text-center">League Rating</th>
                    <th>Trophies</th>
                  </tr>
                </thead>
                <tbody>
                  {data.all_time_standings.map((team, index) => (
                    <tr key={`${team.team_name}-${team.owner_name}`}>
                      <td className="font-medium">
                        {index + 1}
                      </td>
                      <td className="font-semibold">
                        {team.team_name}
                      </td>
                      <td>
                        {team.owner_name}
                      </td>
                      <td className="text-center">
                        {team.record}
                      </td>
                      <td className="text-center">
                        {team.win_pct}
                      </td>
                      <td className="text-center">
                        {team.seasons_played}
                      </td>
                      <td className="font-bold text-center">
                        {team.league_rating}
                      </td>
                      <td className="text-lg">
                        {team.trophies}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notable Games */}
          {notable && (
            <NotableGamesTable
              best={notable.best_games}
              worst={notable.worst_games}
              brutal={notable.brutal_losses}
              pathetic={notable.pathetic_wins}
            />
          )}
        </>
         )}
    </div>
  );
} 