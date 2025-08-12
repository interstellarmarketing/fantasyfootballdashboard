import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type NotableItem = {
  year: number;
  week: number;
  matchup: string;
  score: string;
  margin: number;
  winner: string;
  loser: string;
  score_value: number; // 0-100
  breakdown?: Record<string, number>;
};

function percentile(value: number, values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = sorted.findIndex((v) => v >= value);
  const position = idx === -1 ? sorted.length - 1 : idx;
  return position / (sorted.length - 1 || 1);
}

export async function GET() {
  try {
    // Fetch seasons for context (regular season length)
    const seasons = await prisma.season.findMany({
      select: { year: true, regular_season_weeks: true }
    });
    const seasonToRegWeeks = new Map<number, number>(
      seasons.map((s) => [s.year, s.regular_season_weeks])
    );

    // Gather all matchups including playoffs, excluding BYE or malformed rows
    const matchups = await prisma.matchup.findMany({
      where: { NOT: { is_bye: true } },
      include: { home_team: { include: { TeamSeasonStats: true } }, away_team: { include: { TeamSeasonStats: true } } },
      orderBy: { season_year: 'desc' }
    });

    // Skip unplayed placeholders (0-0)
    const validMatchups = matchups.filter(
      (m) => m.home_team && m.away_team && ((m.home_score ?? 0) > 0 || ((m.away_score ?? 0) > 0))
    );

    // Build per-season-week distributions
    const scoresBySeasonWeek: Record<number, Record<number, number[]>> = {};
    const marginsBySeasonWeek: Record<number, Record<number, number[]>> = {};
    const teamScoresBySeasonWeek: Record<number, Record<number, number[]>> = {};

    for (const m of validMatchups) {
      if (!scoresBySeasonWeek[m.season_year]) scoresBySeasonWeek[m.season_year] = {};
      if (!marginsBySeasonWeek[m.season_year]) marginsBySeasonWeek[m.season_year] = {};
      if (!teamScoresBySeasonWeek[m.season_year]) teamScoresBySeasonWeek[m.season_year] = {};
      if (!scoresBySeasonWeek[m.season_year][m.week]) scoresBySeasonWeek[m.season_year][m.week] = [];
      if (!marginsBySeasonWeek[m.season_year][m.week]) marginsBySeasonWeek[m.season_year][m.week] = [];
      if (!teamScoresBySeasonWeek[m.season_year][m.week]) teamScoresBySeasonWeek[m.season_year][m.week] = [];
      scoresBySeasonWeek[m.season_year][m.week].push(m.home_score + m.away_score);
      marginsBySeasonWeek[m.season_year][m.week].push(Math.abs(m.home_score - m.away_score));
      teamScoresBySeasonWeek[m.season_year][m.week].push(m.home_score, m.away_score);
    }

    // Map playoff weeks to rounds per season
    const playoffWeekOrderBySeason: Record<number, number[]> = {};
    for (const m of validMatchups) {
      if (!m.is_playoff) continue;
      if (!playoffWeekOrderBySeason[m.season_year]) playoffWeekOrderBySeason[m.season_year] = [];
      if (!playoffWeekOrderBySeason[m.season_year].includes(m.week)) playoffWeekOrderBySeason[m.season_year].push(m.week);
    }
    Object.keys(playoffWeekOrderBySeason).forEach((k) => {
      playoffWeekOrderBySeason[Number(k)].sort((a, b) => a - b);
    });

    function playoffImportance(year: number, week: number): number {
      const weeks = playoffWeekOrderBySeason[year];
      if (!weeks || weeks.length === 0) return 0;
      const idx = weeks.indexOf(week);
      if (idx === -1) return 0.6; // generic playoff
      // last -> Final, last-1 -> Semi, last-2 -> Quarter
      if (idx === weeks.length - 1) return 1.0;
      if (idx === weeks.length - 2) return 0.85;
      if (idx === weeks.length - 3) return 0.7;
      return 0.6;
    }

    // Build end-of-season standings per season (wins, points_for) for bubble context
    const teamsBySeason = await prisma.team.findMany({
      select: {
        id: true,
        season_year: true,
        team_name: true,
        wins: true,
        losses: true,
        ties: true,
        points_for: true,
        TeamSeasonStats: true,
      },
    });
    type TeamWithStats = Prisma.TeamGetPayload<{ select: { id: true; season_year: true; team_name: true; wins: true; losses: true; ties: true; points_for: true; TeamSeasonStats: true } }>;
    const seasonToTeams = new Map<number, TeamWithStats[]>();
    for (const t of teamsBySeason) {
      if (!seasonToTeams.has(t.season_year)) seasonToTeams.set(t.season_year, []);
      seasonToTeams.get(t.season_year)!.push(t);
    }

    function playoffCutoffWins(year: number, cutoffSeeds = 4): number {
      const teams = seasonToTeams.get(year) || [];
      const sorted = [...teams].sort((a, b) => {
        const aw = a.wins - a.losses + a.ties * 0.5;
        const bw = b.wins - b.losses + b.ties * 0.5;
        if (bw !== aw) return bw - aw;
        return b.points_for - a.points_for;
      });
      if (sorted.length < cutoffSeeds) return 0;
      const t = sorted[cutoffSeeds - 1];
      return t.wins; // approximate cutoff by raw wins
    }

    function regularSeasonImportance(year: number, week: number, aWins: number, bWins: number): number {
      const regWeeks = seasonToRegWeeks.get(year) ?? 14;
      const isLastTwo = week >= regWeeks - 1;
      if (!isLastTwo) return 0;
      const cutoff = playoffCutoffWins(year, 4);
      const nearCutoff = (wins: number) => {
        const diff = Math.abs(cutoff - wins);
        if (diff <= 0) return 0.7;
        if (diff <= 1) return 0.5;
        if (diff <= 2) return 0.3;
        return 0;
      };
      return Math.max(nearCutoff(aWins), nearCutoff(bWins));
    }

    function allPlayPct(year: number, week: number, teamScore: number): number {
      const scores = teamScoresBySeasonWeek[year]?.[week] || [];
      if (scores.length <= 1) return 0;
      const wins = scores.filter((s) => teamScore > s).length;
      const games = scores.length - 1;
      return wins / games;
    }

    function strengthRankPercent(team: { TeamSeasonStats: { combined_rank: number } | null }, seasonTeams: TeamWithStats[]): number {
      // Use combined_rank when available; lower rank is better. Convert to 0..1 percentile (1 best)
      const ranks = seasonTeams
        .map((t) => t.TeamSeasonStats?.combined_rank ?? Number.POSITIVE_INFINITY)
        .filter((r) => Number.isFinite(r)) as number[];
      if (ranks.length === 0) return 0.5;
      const myRank = team.TeamSeasonStats?.combined_rank;
      if (!Number.isFinite(myRank)) return 0.5;
      const worse = ranks.filter((r) => r > myRank).length;
      return (worse + 1) / (ranks.length + 1);
    }

    const bestGames: NotableItem[] = [];
    const worstGames: NotableItem[] = [];
    const brutalLosses: NotableItem[] = [];
    const patheticWins: NotableItem[] = [];

    for (const m of validMatchups) {
      const year = m.season_year;
      const week = m.week;
      const winnerIsHome = m.home_score >= m.away_score;
      const winnerTeam = winnerIsHome ? m.home_team : m.away_team;
      const loserTeam = winnerIsHome ? m.away_team : m.home_team;
      if (!winnerTeam || !loserTeam) continue;

      const seasonTeams = seasonToTeams.get(year) || [];

      const combined = m.home_score + m.away_score;
      const margin = Math.abs(m.home_score - m.away_score);
      const combinedPct = percentile(combined, scoresBySeasonWeek[year]?.[week] || []);
      const closenessPct = 1 - percentile(margin, marginsBySeasonWeek[year]?.[week] || []);

      const winnerAllPlay = allPlayPct(year, week, winnerIsHome ? m.home_score : m.away_score);
      const loserAllPlay = allPlayPct(year, week, winnerIsHome ? m.away_score : m.home_score);

      // Importance
      const imp = m.is_playoff
        ? playoffImportance(year, week)
        : regularSeasonImportance(year, week, winnerTeam.wins, loserTeam.wins);

      // Upset (winner weaker than loser by season strength)
      const winnerStrength = strengthRankPercent(winnerTeam, seasonTeams);
      const loserStrength = strengthRankPercent(loserTeam, seasonTeams);
      const upsetMag = Math.max(0, loserStrength - winnerStrength); // 0..1

      const matchupName = `${m.home_team!.team_name} vs ${m.away_team!.team_name}`;
      const scoreStr = `${m.home_score.toFixed(2)} - ${m.away_score.toFixed(2)}`;

      // Best Games score
      const bestScore = 100 * (0.35 * imp + 0.30 * closenessPct + 0.20 * combinedPct + 0.10 * upsetMag + 0.05 * winnerAllPlay + 0.05 * loserAllPlay);

      bestGames.push({
        year,
        week,
        matchup: matchupName,
        score: scoreStr,
        margin,
        winner: winnerTeam.team_name,
        loser: loserTeam.team_name,
        score_value: parseFloat(bestScore.toFixed(2)),
        breakdown: { imp, closenessPct, combinedPct, upsetMag, winnerAllPlay, loserAllPlay },
      });

      // Worst Games score
      const blowoutPct = percentile(margin, marginsBySeasonWeek[year]?.[week] || []);
      const lowQuality = 1 - combinedPct;
      const bothTeamsBad = 1 - Math.max(winnerAllPlay, loserAllPlay);
      const worstScore = 100 * (0.40 * lowQuality + 0.35 * blowoutPct + 0.15 * bothTeamsBad + 0.10 * (1 - imp));
      worstGames.push({
        year,
        week,
        matchup: matchupName,
        score: scoreStr,
        margin,
        winner: winnerTeam.team_name,
        loser: loserTeam.team_name,
        score_value: parseFloat(worstScore.toFixed(2)),
        breakdown: { lowQuality, blowoutPct, bothTeamsBad, imp },
      });

      // Brutal Losses (focus on losing team quality and closeness, plus potential elimination)
      const loserScorePct = percentile(winnerIsHome ? m.away_score : m.home_score, teamScoresBySeasonWeek[year]?.[week] || []);
      const brutalScore = 100 * (0.30 * closenessPct + 0.25 * loserAllPlay + 0.25 * loserScorePct + 0.20 * imp);
      brutalLosses.push({
        year,
        week,
        matchup: matchupName,
        score: scoreStr,
        margin,
        winner: winnerTeam.team_name,
        loser: loserTeam.team_name,
        score_value: parseFloat(brutalScore.toFixed(2)),
        breakdown: { closenessPct, loserAllPlay, loserScorePct, imp },
      });

      // Pathetic Wins (focus on winning team low quality and weak-opponent context)
      const winnerScorePct = percentile(winnerIsHome ? m.home_score : m.away_score, teamScoresBySeasonWeek[year]?.[week] || []);
      const oppStrength = loserStrength; // weaker opponent -> higher pathetic score
      const patheticScore = 100 * (0.40 * (1 - winnerAllPlay) + 0.30 * (1 - winnerScorePct) + 0.20 * (1 - oppStrength) + 0.10 * (1 - imp));
      patheticWins.push({
        year,
        week,
        matchup: matchupName,
        score: scoreStr,
        margin,
        winner: winnerTeam.team_name,
        loser: loserTeam.team_name,
        score_value: parseFloat(patheticScore.toFixed(2)),
        breakdown: { winnerAllPlay, winnerScorePct, oppStrength, imp },
      });
    }

    function top10(arr: NotableItem[], desc = true): NotableItem[] {
      const sorted = [...arr].sort((a, b) => (desc ? b.score_value - a.score_value : a.score_value - b.score_value));
      return sorted.slice(0, 10);
    }

    return NextResponse.json({
      best_games: top10(bestGames, true),
      worst_games: top10(worstGames, true),
      brutal_losses: top10(brutalLosses, true),
      pathetic_wins: top10(patheticWins, true),
    });
  } catch (error) {
    console.error('Error computing notable games', error);
    return NextResponse.json({ error: 'Failed to compute notable games' }, { status: 500 });
  }
}


