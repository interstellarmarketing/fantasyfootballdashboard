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
         <div className="bg-gradient-to-br from-blue-900 to-purple-900 px-2 py-4 sm:px-4 sm:py-6 rounded-lg shadow-md">
            <div className="bg-indigo-900 px-3 py-3 border-b border-white/10 rounded-t-md -mx-2 sm:-mx-4 mb-2 sm:mb-3">
              <h2 className="text-white font-bold text-lg">All-Time Franchise Rankings</h2>
            </div>
            <div className="relative w-full overflow-auto px-2 py-2 sm:px-4 sm:py-4">
              <table className="w-full table-auto caption-bottom text-[12px] sm:text-sm">
                <thead className="bg-indigo-900">
                  <tr className="border-b border-black">
                    <th className="h-10 sm:h-12 px-1.5 sm:px-2 text-left align-middle text-indigo-100 uppercase tracking-wider font-medium text-[11px] sm:text-xs">Rank</th>
                    <th className="h-10 sm:h-12 px-1.5 sm:px-2 text-left align-middle text-indigo-100 uppercase tracking-wider font-medium text-[11px] sm:text-xs">Team</th>
                    <th className="h-10 sm:h-12 px-1.5 sm:px-2 text-left align-middle text-indigo-100 uppercase tracking-wider font-medium text-[11px] sm:text-xs">Owner</th>
                    <th className="h-10 sm:h-12 px-1.5 sm:px-2 text-center align-middle text-indigo-100 uppercase tracking-wider font-medium text-[11px] sm:text-xs">Record</th>
                    <th className="h-10 sm:h-12 px-1.5 sm:px-2 text-center align-middle text-indigo-100 uppercase tracking-wider font-medium text-[11px] sm:text-xs">Win %</th>
                    <th className="h-10 sm:h-12 px-1.5 sm:px-2 text-center align-middle text-indigo-100 uppercase tracking-wider font-medium text-[11px] sm:text-xs">Seasons</th>
                    <th className="h-10 sm:h-12 px-1.5 sm:px-2 text-center align-middle text-indigo-100 uppercase tracking-wider font-medium text-[11px] sm:text-xs">League Rating</th>
                    <th className="h-10 sm:h-12 px-1.5 sm:px-2 text-left align-middle text-indigo-100 uppercase tracking-wider font-medium text-[11px] sm:text-xs">Trophies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 [&_tr:last-child]:border-0">
                  {data.all_time_standings.map((team, index) => (
                    <tr key={`${team.team_name}-${team.owner_name}`} className="hover:bg-white/10 transition-colors border-b border-black">
                      <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 whitespace-nowrap text-[12px] sm:text-sm font-medium text-white text-left">
                        {index + 1}
                      </td>
                      <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 whitespace-nowrap text-[12px] sm:text-sm font-semibold text-white text-left">
                        {team.team_name}
                      </td>
                      <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 whitespace-nowrap text-[12px] sm:text-sm text-white/80 text-left">
                        {team.owner_name}
                      </td>
                      <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 whitespace-nowrap text-[12px] sm:text-sm text-white/80 text-center">
                        {team.record}
                      </td>
                      <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 whitespace-nowrap text-[12px] sm:text-sm text-white/80 text-center">
                        {team.win_pct}
                      </td>
                      <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 whitespace-nowrap text-[12px] sm:text-sm text-white/80 text-center">
                        {team.seasons_played}
                      </td>
                      <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 whitespace-nowrap text-[12px] sm:text-sm font-bold text-white text-center">
                        {team.league_rating}
                      </td>
                      <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 whitespace-nowrap text-lg text-white text-left">
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