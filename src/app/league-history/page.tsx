'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchJSON } from '@/lib/api';
import NotableGamesTable, { NotableItem } from '@/components/tables/notable-games-table';
import FranchiseRankingsTable from '@/components/tables/franchise-rankings-table';

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
  best_games: NotableItem[];
  worst_games: NotableItem[];
  brutal_losses: NotableItem[];
  pathetic_wins: NotableItem[];
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
          <FranchiseRankingsTable standings={data.all_time_standings} />

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