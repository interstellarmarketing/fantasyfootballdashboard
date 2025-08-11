'use client';

import { useState } from 'react';

type NotableItem = {
  year: number;
  week: number;
  matchup: string;
  score: string;
  margin: number;
  winner: string;
  loser: string;
  score_value: number;
  breakdown?: Record<string, number>;
};

interface NotableGamesTableProps {
  best: NotableItem[];
  worst: NotableItem[];
  brutal: NotableItem[];
  pathetic: NotableItem[];
}

type TabKey = 'best' | 'worst' | 'brutal' | 'pathetic';

export default function NotableGamesTable({ best, worst, brutal, pathetic }: NotableGamesTableProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('best');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'best', label: 'Best Games' },
    { key: 'worst', label: 'Worst Games' },
    { key: 'brutal', label: 'Brutal Losses' },
    { key: 'pathetic', label: 'Pathetic Wins' },
  ];

  const rows = activeTab === 'best' ? best : activeTab === 'worst' ? worst : activeTab === 'brutal' ? brutal : pathetic;

  return (
    <div className="bg-gradient-to-br from-blue-900 to-purple-900 px-2 py-4 sm:px-4 sm:py-6 rounded-lg shadow-lg">
      <div className="bg-indigo-900 px-3 py-3 border-b border-white/10 rounded-t-md -mx-2 sm:-mx-4 mb-2 sm:mb-3">
        <h3 className="text-white font-bold text-lg">Notable Games</h3>
      </div>

      {/* Tabs */}
      <div className="mb-3 w-full">
        <div className="grid w-full grid-cols-4 items-center justify-center rounded-lg bg-gray-600/50 text-gray-300">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`justify-center whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out hover:bg-gray-800 hover:text-gray-100 flex items-center ${
                activeTab === tab.key ? 'bg-indigo-600 text-white shadow-sm' : ''
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="relative w-full overflow-auto rounded-lg">
        <table className="w-full table-auto caption-bottom text-[12px] sm:text-sm">
          <thead className="bg-indigo-900">
            <tr className="border-b border-black">
              <th className="h-10 sm:h-12 px-1.5 sm:px-2 text-left align-middle font-medium text-indigo-100 whitespace-nowrap text-[11px] sm:text-xs">Matchup</th>
              <th className="h-10 sm:h-12 px-1.5 sm:px-2 text-center align-middle font-medium text-indigo-100 whitespace-nowrap text-[11px] sm:text-xs">Year</th>
              <th className="h-10 sm:h-12 px-1.5 sm:px-2 text-center align-middle font-medium text-indigo-100 whitespace-nowrap text-[11px] sm:text-xs">Week</th>
              <th className="h-10 sm:h-12 px-1.5 sm:px-2 text-center align-middle font-medium text-indigo-100 whitespace-nowrap text-[11px] sm:text-xs">Score</th>
              <th className="h-10 sm:h-12 px-1.5 sm:px-2 text-center align-middle font-medium text-indigo-100 whitespace-nowrap text-[11px] sm:text-xs">Margin</th>
              <th className="h-10 sm:h-12 px-1.5 sm:px-2 text-center align-middle font-medium text-indigo-100 whitespace-nowrap text-[11px] sm:text-xs">Notability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 [&_tr:last-child]:border-0">
            {rows.map((r, i) => (
              <tr key={`${r.year}-${r.week}-${i}`} className="hover:bg-white/10 transition-colors border-b border-black">
                <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 text-[12px] sm:text-sm text-white">{r.matchup}</td>
                <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 text-[12px] sm:text-sm text-white text-center">{r.year}</td>
                <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 text-[12px] sm:text-sm text-white text-center">{r.week}</td>
                <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 text-[12px] sm:text-sm text-white text-center">{r.score}</td>
                <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 text-[12px] sm:text-sm text-white text-center">{r.margin.toFixed(2)}</td>
                <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 text-[12px] sm:text-sm text-white text-center">
                  <div className="w-full h-2.5 sm:h-3 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-400`}
                      style={{ width: `${Math.max(6, Math.min(100, r.score_value))}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[10px] sm:text-xs text-purple-200/80">{r.score_value.toFixed(1)} / 100</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


