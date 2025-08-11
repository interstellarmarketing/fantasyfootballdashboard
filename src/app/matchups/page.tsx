'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchJSON } from '@/lib/api';
import MatchupsTable from '@/components/tables/matchups-table';

interface Matchup {
  id: number;
  week: number;
  is_playoff: boolean;
  home_team: string;
  home_score: number;
  away_team: string;
  away_score: number;
  winner: string;
  margin: number;
  total_score: number;
  round: string;
}

interface MatchupsData {
  year: number;
  matchups: Matchup[];
  matchups_by_week: Record<string, Matchup[]>;
  stats: {
    total_games: number;
    regular_season_games: number;
    playoff_games: number;
    average_score: number;
    highest_score: number;
    lowest_score: number;
    biggest_blowout: number;
    closest_game: number;
  };
}

export default function MatchupsPage() {
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [filter, setFilter] = useState<'all' | 'regular' | 'playoff'>('all');
  const currentYear = new Date().getFullYear();

  const { data, isLoading, error } = useQuery<MatchupsData>({
    queryKey: ['matchups', year],
    queryFn: () => fetchJSON(`/api/matchups/${year}`),
  });

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(parseInt(event.target.value, 10));
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(event.target.value as 'all' | 'regular' | 'playoff');
  };

  const filteredMatchups = data?.matchups.filter(matchup => {
    if (filter === 'regular') return !matchup.is_playoff;
    if (filter === 'playoff') return matchup.is_playoff;
    return true;
  }) || [];

  const yearOptions = [];
  for (let y = currentYear - 1; y >= 2015; y--) {
    yearOptions.push(y);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Matchups</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading matchups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Matchups</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">Failed to load matchup data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Matchups</h1>
        <div className="flex items-center space-x-4 text-white">
          <label htmlFor="year-select" className="font-semibold">Season:</label>
          <select 
            id="year-select" 
            value={year} 
            onChange={handleYearChange} 
            className="p-2 rounded-md bg-purple-800 text-white border border-purple-700"
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          
          <label htmlFor="filter-select" className="font-semibold ml-4">Filter:</label>
          <select 
            id="filter-select" 
            value={filter} 
            onChange={handleFilterChange} 
            className="p-2 rounded-md bg-purple-800 text-white border border-purple-700"
          >
            <option value="all">All Games</option>
            <option value="regular">Regular Season</option>
            <option value="playoff">Playoffs</option>
          </select>
        </div>
      </div>
      
      {data && (
        <div className="space-y-6">
          {/* Season Stats */}
          <div className="bg-gradient-to-br from-blue-900 to-purple-900 shadow rounded-lg p-2 sm:p-6 border border-purple-700">
            <h2 className="text-xl font-semibold mb-4 text-white">{data.year} Season Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-800/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-200">{data.stats.total_games}</div>
                <div className="text-sm text-blue-200/80">Total Games</div>
              </div>
              <div className="text-center p-4 bg-green-800/50 rounded-lg">
                <div className="text-2xl font-bold text-green-200">{data.stats.regular_season_games}</div>
                <div className="text-sm text-green-200/80">Regular Season</div>
              </div>
              <div className="text-center p-4 bg-purple-800/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-200">{data.stats.playoff_games}</div>
                <div className="text-sm text-purple-200/80">Playoff Games</div>
              </div>
              <div className="text-center p-4 bg-yellow-800/50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-200">{data.stats.average_score.toFixed(1)}</div>
                <div className="text-sm text-yellow-200/80">Avg Score</div>
              </div>
            </div>
          </div>

          {/* Matchups Table */}
          <div className="bg-gradient-to-br from-blue-900 to-purple-900 shadow rounded-lg p-2 sm:p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">
              {filter === 'all' ? 'All Matchups' : 
               filter === 'regular' ? 'Regular Season Matchups' : 
               'Playoff Matchups'} ({filteredMatchups.length} games)
            </h2>
            <MatchupsTable matchups={filteredMatchups} />
          </div>
        </div>
      )}
    </div>
  );
} 