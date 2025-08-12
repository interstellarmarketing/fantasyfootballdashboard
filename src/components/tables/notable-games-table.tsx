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
    <div className="card card--gradient px-2 py-4 sm:px-4 sm:py-6 shadow-lg">
      <div className="card-header">
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
        <table className="table">
          <thead className="bg-indigo-900">
            <tr>
              <th>Matchup</th>
              <th className="text-center">Year</th>
              <th className="text-center">Week</th>
              <th className="text-center">Score</th>
              <th className="text-center">Margin</th>
              <th className="text-center">Notability</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.year}-${r.week}-${i}`}>
                <td>{r.matchup}</td>
                <td className="text-center">{r.year}</td>
                <td className="text-center">{r.week}</td>
                <td className="text-center">{r.score}</td>
                <td className="text-center">{r.margin.toFixed(2)}</td>
                <td className="text-center">
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


