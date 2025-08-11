'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchJSON } from '@/lib/api';
import RecordsTable from '@/components/tables/records-table';

interface RecordBookData {
  shootouts: any[];
  snoozers: any[];
  blowouts: any[];
  nailbiters: any[];
  top_scores: any[];
  low_scores: any[];
}

export default function RecordBookPage() {
  const { data, isLoading, error } = useQuery<RecordBookData>({
    queryKey: ['recordBook'],
    queryFn: () => fetchJSON('/api/record-book'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Record Book</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-purple-200">Loading records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Record Book</h1>
        </div>
        <div className="bg-red-900/40 border border-red-700 rounded-lg p-6">
          <p className="text-red-200">Failed to load record book data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">All-Time Record Book</h1>
      </div>
      
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RecordsTable 
            records={data.shootouts} 
            title="Top 10 Highest Scoring Games" 
            type="shootouts" 
          />
          <RecordsTable 
            records={data.snoozers} 
            title="Top 10 Lowest Scoring Games" 
            type="snoozers" 
          />
          <RecordsTable 
            records={data.blowouts} 
            title="Top 10 Biggest Blowouts" 
            type="blowouts" 
          />
          <RecordsTable 
            records={data.nailbiters} 
            title="Top 10 Closest Games" 
            type="nailbiters" 
          />
          <RecordsTable 
            records={data.top_scores} 
            title="Top 10 Highest Individual Scores" 
            type="top-scores" 
          />
          <RecordsTable 
            records={data.low_scores} 
            title="Top 10 Lowest Individual Scores" 
            type="low-scores" 
          />
        </div>
      )}
    </div>
  );
} 