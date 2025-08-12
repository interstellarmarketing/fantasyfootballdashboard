'use client';

interface FranchiseStanding {
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
}

interface FranchiseRankingsTableProps {
  standings: FranchiseStanding[];
  title?: string;
}

export default function FranchiseRankingsTable({
  standings,
  title = 'All-Time Franchise Rankings',
}: FranchiseRankingsTableProps) {
  // Ensure consistent ordering by league rating (desc) while keeping API behavior intact
  const rows = [...standings].sort((a, b) => b.league_rating - a.league_rating);

  return (
    <div className="card card--gradient px-2 py-4 sm:px-4 sm:py-6 shadow-lg">
      <div className="card-header">
        <h3 className="text-white font-bold text-lg">{title}</h3>
      </div>

      <div className="relative w-full overflow-auto rounded-lg">
        <table className="table table--nowrap table--dense">
          <thead>
            <tr>
              <th className="text-left w-12 sm:w-14">Rank</th>
              <th className="text-left w-[220px] sm:w-[300px]">Team</th>
              <th className="text-left">Owner</th>
              <th className="text-center w-24 sm:w-28">Record</th>
              <th className="text-center w-16 sm:w-16">Win %</th>
              <th className="text-center w-16 sm:w-20">Seasons</th>
              <th className="text-center w-16 sm:w-20">Rating</th>
              <th className="text-left w-20 sm:w-24">Trophies</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((team, index) => (
              <tr key={`${team.team_name}-${team.owner_name}-${index}`} className="h-12">
                <td className="font-medium align-middle">{index + 1}</td>
                <td className="font-semibold align-middle" style={{ whiteSpace: 'normal' }}>
                  <span
                    className="block break-words"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      maxWidth: '300px',
                    }}
                  >
                    {team.team_name}
                  </span>
                </td>
                <td className="whitespace-nowrap align-middle">{team.owner_name}</td>
                <td className="text-center align-middle">{team.record}</td>
                <td className="text-center align-middle">{team.win_pct}</td>
                <td className="text-center align-middle">{team.seasons_played}</td>
                <td className="font-bold text-center align-middle">{team.league_rating}</td>
                <td className="text-lg align-middle">{team.trophies || 'None'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


