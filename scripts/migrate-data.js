"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var sqlite3 = require("sqlite3");
var sqlite_1 = require("sqlite");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var db, seasons, _i, seasons_1, season, teams, _a, teams_1, team, players, _b, players_1, player, matchups, _c, matchups_1, matchup, boxScorePlayers, _d, boxScorePlayers_1, bsp, draftPicks, _e, draftPicks_1, dp;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, (0, sqlite_1.open)({
                        filename: '../fantasy_league.db',
                        driver: sqlite3.Database,
                    })];
                case 1:
                    db = _f.sent();
                    console.log('Migrating seasons...');
                    return [4 /*yield*/, db.all('SELECT * FROM seasons')];
                case 2:
                    seasons = _f.sent();
                    _i = 0, seasons_1 = seasons;
                    _f.label = 3;
                case 3:
                    if (!(_i < seasons_1.length)) return [3 /*break*/, 6];
                    season = seasons_1[_i];
                    return [4 /*yield*/, prisma.season.create({ data: season })];
                case 4:
                    _f.sent();
                    _f.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    console.log('Migrating teams...');
                    return [4 /*yield*/, db.all('SELECT * FROM teams')];
                case 7:
                    teams = _f.sent();
                    _a = 0, teams_1 = teams;
                    _f.label = 8;
                case 8:
                    if (!(_a < teams_1.length)) return [3 /*break*/, 11];
                    team = teams_1[_a];
                    return [4 /*yield*/, prisma.team.create({ data: team })];
                case 9:
                    _f.sent();
                    _f.label = 10;
                case 10:
                    _a++;
                    return [3 /*break*/, 8];
                case 11:
                    console.log('Migrating players...');
                    return [4 /*yield*/, db.all('SELECT * FROM players')];
                case 12:
                    players = _f.sent();
                    _b = 0, players_1 = players;
                    _f.label = 13;
                case 13:
                    if (!(_b < players_1.length)) return [3 /*break*/, 16];
                    player = players_1[_b];
                    return [4 /*yield*/, prisma.player.create({ data: player })];
                case 14:
                    _f.sent();
                    _f.label = 15;
                case 15:
                    _b++;
                    return [3 /*break*/, 13];
                case 16:
                    console.log('Migrating matchups...');
                    return [4 /*yield*/, db.all('SELECT * FROM matchups')];
                case 17:
                    matchups = _f.sent();
                    _c = 0, matchups_1 = matchups;
                    _f.label = 18;
                case 18:
                    if (!(_c < matchups_1.length)) return [3 /*break*/, 21];
                    matchup = matchups_1[_c];
                    return [4 /*yield*/, prisma.matchup.create({ data: matchup })];
                case 19:
                    _f.sent();
                    _f.label = 20;
                case 20:
                    _c++;
                    return [3 /*break*/, 18];
                case 21:
                    console.log('Migrating box_score_players...');
                    return [4 /*yield*/, db.all('SELECT * FROM box_score_players')];
                case 22:
                    boxScorePlayers = _f.sent();
                    _d = 0, boxScorePlayers_1 = boxScorePlayers;
                    _f.label = 23;
                case 23:
                    if (!(_d < boxScorePlayers_1.length)) return [3 /*break*/, 26];
                    bsp = boxScorePlayers_1[_d];
                    return [4 /*yield*/, prisma.boxScorePlayer.create({ data: bsp })];
                case 24:
                    _f.sent();
                    _f.label = 25;
                case 25:
                    _d++;
                    return [3 /*break*/, 23];
                case 26:
                    console.log('Migrating draft_picks...');
                    return [4 /*yield*/, db.all('SELECT * FROM draft_picks')];
                case 27:
                    draftPicks = _f.sent();
                    _e = 0, draftPicks_1 = draftPicks;
                    _f.label = 28;
                case 28:
                    if (!(_e < draftPicks_1.length)) return [3 /*break*/, 31];
                    dp = draftPicks_1[_e];
                    return [4 /*yield*/, prisma.draftPick.create({ data: dp })];
                case 29:
                    _f.sent();
                    _f.label = 30;
                case 30:
                    _e++;
                    return [3 /*break*/, 28];
                case 31:
                    console.log('Data migration complete!');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
