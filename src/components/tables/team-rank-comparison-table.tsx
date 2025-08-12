'use client';

import Link from 'next/link';
import { Info } from 'lucide-react';
import { useMemo, useState } from 'react';

interface TeamSeasonStats {
  team_id: number;
  team: {
    team_name: string;
    logo_url?: string | null;
  };
  actual_rank: number;
  power_rank: number;
  median_rank: number;
  combined_rank: number;
}

interface TeamRankComparisonTableProps {
  standings: TeamSeasonStats[];
}

type ColumnKey = 'actual' | 'power' | 'median' | 'combined';

function getPercentFromRank(rank: number, numTeams: number): number {
  if (!rank || rank < 1 || numTeams <= 1) return 0;
  return (numTeams - rank + 1) / numTeams; // 1.0 best -> 0 worst
}

function colorClass(percent: number): string {
  if (percent >= 0.85) return 'from-green-500 to-emerald-400';
  if (percent >= 0.65) return 'from-lime-400 to-green-400';
  if (percent >= 0.45) return 'from-yellow-400 to-amber-400';
  if (percent >= 0.25) return 'from-orange-400 to-amber-500';
  return 'from-red-500 to-rose-500';
}

export default function TeamRankComparisonTable({ standings }: TeamRankComparisonTableProps) {
  // Fixed default sort to 'actual' per request
  const sortBy: ColumnKey = 'actual';
  const [showInfoModal, setShowInfoModal] = useState(false);

  const numTeams = standings.length || 1;

  const rows = useMemo(() => {
    const mapped = standings.map((t) => ({
      team_id: t.team_id,
      team_name: t.team.team_name,
      logo_url: t.team.logo_url ?? undefined,
      actual_rank: t.actual_rank,
      power_rank: t.power_rank,
      median_rank: t.median_rank,
      combined_rank: t.combined_rank,
    }));

    const keyToRank = (r: typeof mapped[number], key: ColumnKey) => {
      switch (key) {
        case 'actual':
          return r.actual_rank;
        case 'power':
          return r.power_rank;
        case 'median':
          return r.median_rank;
        case 'combined':
        default:
          return r.combined_rank;
      }
    };

    return mapped.sort((a, b) => keyToRank(a, sortBy) - keyToRank(b, sortBy));
  }, [standings, sortBy]);

  const columns: { key: ColumnKey; label: string }[] = [
    { key: 'actual', label: 'Actual' },
    { key: 'power', label: 'Power' },
    { key: 'median', label: 'Median' },
    { key: 'combined', label: 'Combined' },
  ];

  return (
    <div className="card card--gradient px-2 py-4 sm:px-4 sm:py-6 shadow-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white">Team Rank Comparison</h3>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-2xl">
            Use this table to compare teams across the different ranking categories.
          </p>
        </div>
        <button
          onClick={() => setShowInfoModal(true)}
          className="btn--icon"
          title="Standings Categories Info"
          aria-label="Standings Categories Info"
        >
          <Info className="w-5 h-5 text-purple-200" />
        </button>
      </div>

      <div className="relative w-full overflow-auto rounded-lg">
        <table className="table">
          <thead>
            <tr>
              <th>Team</th>
              {columns.map((c) => (
                <th key={c.key} className="text-center">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.team_id}>
                <td>
                  <Link
                    href={`/team/${r.team_id}`}
                    className="flex items-center gap-2 hover:text-gray-200 transition-colors min-w-0"
                  >
                    {r.logo_url ? (
                      <img
                        src={r.logo_url}
                        alt={`${r.team_name} logo`}
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border border-white/20 shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center text-xs sm:text-sm font-bold text-white shrink-0">
                        {r.team_name.charAt(0)}
                      </div>
                    )}
                    <span className="break-words leading-6">{r.team_name}</span>
                  </Link>
                </td>

                {columns.map((c) => {
                  const rank =
                    c.key === 'actual'
                      ? r.actual_rank
                      : c.key === 'power'
                      ? r.power_rank
                      : c.key === 'median'
                      ? r.median_rank
                      : r.combined_rank;
                  const percent = getPercentFromRank(rank, numTeams);
                  const width = Math.max(6, Math.round(percent * 100)); // keep at least visible
                  const color = colorClass(percent);
                  const title = `${rank} of ${numTeams}`;
                  return (
                    <td key={c.key} className="text-center" title={title}>
                      <div className="w-full h-2.5 sm:h-3 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${color}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <div className="mt-1 text-[10px] sm:text-xs text-purple-200/80">#{rank}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
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
                <p className="text-purple-200">Based on each team\'s final finishing place for the season.</p>
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


