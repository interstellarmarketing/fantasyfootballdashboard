// Ambient module declaration to satisfy TypeScript in scripts
declare module 'espn-fantasy-football-api/node' {
  export class Client {
    constructor(opts: { leagueId: number });
    setCookies(cookies: { espnS2: string; SWID: string }): void;
    getLeagueInfo(params: { seasonId: number }): Promise<any>;
    getTeamsAtWeek(params: { seasonId: number; scoringPeriodId: number }): Promise<any[]>;
    getBoxscoreForWeek(params: { seasonId: number; matchupPeriodId: number; scoringPeriodId: number }): Promise<any[]>;
    getDraftInfo(params: { seasonId: number }): Promise<any[]>;
    getHistoricalTeamsAtWeek(params: { seasonId: number; scoringPeriodId: number }): Promise<any[]>;
    getHistoricalScoreboardForWeek(params: { seasonId: number; matchupPeriodId: number; scoringPeriodId: number }): Promise<any[]>;
  }
}


