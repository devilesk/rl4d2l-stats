#!/usr/bin/env node

const dotenv = require('dotenv');

const envConfig = dotenv.config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' });
const envWizard = require('./src/cli/envWizard');
const mysql = require('mysql');
const fs = require('fs-extra');
const path = require('path');
const columns = require('./src/data/columns.json');
const program = require('commander');
const pjson = require('./package.json');
const buildCss = require('./scripts/build-css');
const buildJs = require('./scripts/build-js');
const rev = require('./scripts/rev');
const chokidar = require('chokidar');
const Promise = require('bluebird');
const util = require('util');
const { spawn } = require('child_process');
const logger = require('./src/cli/logger');
const renderTemplate = require('./src/cli/renderTemplate');
const processTrueskill = require('./src/cli/processTrueskill');
const queryBuilder = require('./src/cli/queryBuilder');
const processRankings = require('./src/common/processRankings');
const discordConfig = require('./src/discord/config');
const execQuery = require('./src/common/execQuery');
const { getAvg, getStdDev, getZScore, zScoreToPercentile } = require('./src/common/util');

const cols = {
    survivor: columns.survivor.map(row => row.data).filter(header => header.startsWith('ply') && header != 'plyTotalRounds'),
    infected: columns.infected.map(row => row.data).filter(header => header.startsWith('inf') && header != 'infTotalRounds'),
};

const sideToPrefix = side => (side == 'survivor' ? 'ply' : 'inf');

const sides = ['survivor', 'infected'];

const insertUnknownPlayersQuery = `INSERT INTO players (steamid, name)
SELECT a.steamid, a.steamid FROM survivor a LEFT JOIN players b ON a.steamid = b.steamid WHERE b.steamid IS NULL AND a.deleted = 0
UNION SELECT a.steamid, a.steamid FROM infected a LEFT JOIN players b ON a.steamid = b.steamid WHERE b.steamid IS NULL AND a.deleted = 0
UNION SELECT a.steamid, a.steamid FROM matchlog a LEFT JOIN players b ON a.steamid = b.steamid WHERE b.steamid IS NULL AND a.deleted = 0
UNION SELECT a.steamid, a.steamid FROM pvp_ff a LEFT JOIN players b ON a.steamid = b.steamid WHERE b.steamid IS NULL AND a.deleted = 0
UNION SELECT a.steamid, a.steamid FROM pvp_infdmg a LEFT JOIN players b ON a.steamid = b.steamid WHERE b.steamid IS NULL AND a.deleted = 0;`;

const lastTableUpdateTimesQuery = database => `SELECT TABLE_NAME as tableName, UPDATE_TIME as updateTime FROM information_schema.tables WHERE TABLE_SCHEMA = '${database}';`;

const mapsQuery = "SELECT map, CONCAT(campaign, ' ', round) as name FROM maps;";

const matchAggregateQueries = {
    total: (tableName, cols, minMatchId, maxMatchId, excludeSteamIds) => queryBuilder(tableName, cols, 'total', [], minMatchId, maxMatchId, excludeSteamIds),
    rndAvg: (tableName, cols, minMatchId, maxMatchId, excludeSteamIds) => queryBuilder(tableName, cols, 'avg', [], minMatchId, maxMatchId, excludeSteamIds),
    stddev: (tableName, cols, minMatchId, maxMatchId, excludeSteamIds) => queryBuilder(tableName, cols, 'stddev', [], minMatchId, maxMatchId, excludeSteamIds),
    indTotal: (tableName, cols, minMatchId, maxMatchId, excludeSteamIds) => queryBuilder(tableName, cols, 'total', ['player'], minMatchId, maxMatchId, excludeSteamIds),
    indRndAvg: (tableName, cols, minMatchId, maxMatchId, excludeSteamIds) => queryBuilder(tableName, cols, 'avg', ['player'], minMatchId, maxMatchId, excludeSteamIds),
    indRndPct: (tableName, cols, minMatchId, maxMatchId, excludeSteamIds) => queryBuilder(tableName, cols, 'teamPct', ['player'], minMatchId, maxMatchId, excludeSteamIds),
};

const matchSingleQueries = {
    rndTotal: (tableName, cols, minMatchId, maxMatchId) => queryBuilder(tableName, cols, '', ['player'], minMatchId, maxMatchId),
    rndPct: (tableName, cols, minMatchId, maxMatchId) => queryBuilder(tableName, cols, 'teamPct', ['match', 'round', 'team', 'player'], minMatchId, maxMatchId),
};

const matchRoundQuery = matchId => `SELECT * FROM round WHERE deleted = 0 and matchId = ${matchId} ORDER BY matchId, round, isSecondHalf;`;

const seasonQuery = 'SELECT season, startedAt, endedAt FROM season ORDER BY season';

const matchTeamsQuery = matchId => `SELECT GROUP_CONCAT(DISTINCT na.name ORDER BY na.name SEPARATOR ', ') as teamA, a.result as resultA,
GROUP_CONCAT(DISTINCT nb.name ORDER BY nb.name SEPARATOR ', ') as teamB, b.result as resultB
FROM (SELECT * FROM matchlog WHERE team = 0 AND deleted = 0) a
JOIN (SELECT * FROM matchlog WHERE team = 1 AND deleted = 0) b
ON a.matchId = b.matchId
JOIN players na ON a.steamid = na.steamid
JOIN players nb ON b.steamid = nb.steamid
WHERE a.matchId = ${matchId}
GROUP BY a.matchId DESC, a.map, a.result, b.result;`;

const pvpQueries = {
    match: (tableName, matchId) => `SELECT a.round as round, a.steamid as aId, b.name as attacker, a.victim as vId, c.name as victim, SUM(a.damage) as damage
FROM ${tableName} a JOIN players b ON a.steamid = b.steamid JOIN players c ON a.victim = c.steamid
JOIN survivor d ON a.steamid = d.steamid AND a.matchId = d.matchId AND a.round = d.round 
JOIN survivor e ON a.victim = e.steamid AND a.matchId = e.matchId AND a.round = e.round
WHERE a.deleted = 0 AND a.matchId = ${matchId}${tableName === 'pvp_ff' ? ' AND d.team = e.team' : ' AND d.team != e.team'}
AND d.deleted = 0 AND e.deleted = 0
GROUP BY a.matchId, a.round, a.steamid, a.victim, b.name, c.name;`,
    league: tableName => `SELECT a.aId as aId, b.name as attacker, a.vId as vId, c.name as victim, a.damage as damage, a.rounddamage as rounddamage
FROM (SELECT a.steamid as aId, a.victim as vId, SUM(a.damage) as damage, SUM(a.damage) / COUNT(a.damage) as rounddamage
FROM ${tableName} a
WHERE a.deleted = 0
GROUP BY a.steamid, a.victim) a
JOIN players b ON a.aId = b.steamid JOIN players c ON a.vId = c.steamid
GROUP BY a.aId, a.vId, b.name, c.name;`,
};

const pvpSeasonQueries = {
    league: (tableName, season) => `SELECT a.aId as aId, b.name as attacker, a.vId as vId, c.name as victim, a.damage as damage, a.rounddamage as rounddamage
FROM (SELECT a.steamid as aId, a.victim as vId, SUM(a.damage) as damage, SUM(a.damage) / COUNT(a.damage) as rounddamage
FROM ${tableName} a
JOIN (SELECT startedAt, endedAt FROM season WHERE season = ${season}) c
WHERE a.deleted = 0 AND a.matchId >= c.startedAt AND a.matchId <= c.endedAt
GROUP BY a.steamid, a.victim) a
JOIN players b ON a.aId = b.steamid JOIN players c ON a.vId = c.steamid
GROUP BY a.aId, a.vId, b.name, c.name;`,
};

const playerQuery = `SELECT b.name as name, a.steamid FROM survivor a JOIN players b ON a.steamid = b.steamid
UNION SELECT b.name as name, a.steamid FROM infected a JOIN players b ON a.steamid = b.steamid
UNION SELECT b.name as name, a.steamid FROM matchlog a JOIN players b ON a.steamid = b.steamid
UNION SELECT b.name as name, a.steamid FROM pvp_ff a JOIN players b ON a.steamid = b.steamid
UNION SELECT b.name as name, a.steamid FROM pvp_infdmg a JOIN players b ON a.steamid = b.steamid
ORDER BY name;`;

const wlMatrixQueries = {
    with: `SELECT MAX(na.name) as name1, MAX(nb.name) as name2, a.steamid as steamid1, b.steamid as steamid2, a.result as result, COUNT(a.result) as count
FROM matchlog a
JOIN matchlog b ON a.matchId = b.matchId
JOIN players na ON a.steamid = na.steamid
JOIN players nb ON b.steamid = nb.steamid
WHERE a.steamid <> b.steamid AND a.team = b.team
AND a.deleted = 0 AND b.deleted = 0
GROUP BY a.steamid, b.steamid, a.result
ORDER BY name1, name2, a.result`,
    against: `SELECT MAX(na.name) as name1, MAX(nb.name) as name2, a.steamid as steamid1, b.steamid as steamid2, a.result as result, COUNT(a.result) as count
FROM matchlog a
JOIN matchlog b ON a.matchId = b.matchId
JOIN players na ON a.steamid = na.steamid
JOIN players nb ON b.steamid = nb.steamid
WHERE a.steamid <> b.steamid AND a.team <> b.team
AND a.deleted = 0 AND b.deleted = 0
GROUP BY a.steamid, b.steamid, a.result
ORDER BY name1, name2, a.result`,
};

const wlMatrixSeasonQueries = {
    with: season => `SELECT MAX(na.name) as name1, MAX(nb.name) as name2, a.steamid as steamid1, b.steamid as steamid2, a.result as result, COUNT(a.result) as count
FROM matchlog a
JOIN matchlog b ON a.matchId = b.matchId
JOIN players na ON a.steamid = na.steamid
JOIN players nb ON b.steamid = nb.steamid
JOIN (SELECT startedAt, endedAt FROM season WHERE season = ${season}) c
WHERE a.steamid <> b.steamid AND a.team = b.team
AND a.matchId >= c.startedAt AND a.matchId <= c.endedAt
AND a.deleted = 0 AND b.deleted = 0
GROUP BY a.steamid, b.steamid, a.result
ORDER BY name1, name2, a.result`,
    against: season => `SELECT MAX(na.name) as name1, MAX(nb.name) as name2, a.steamid as steamid1, b.steamid as steamid2, a.result as result, COUNT(a.result) as count
FROM matchlog a
JOIN matchlog b ON a.matchId = b.matchId
JOIN players na ON a.steamid = na.steamid
JOIN players nb ON b.steamid = nb.steamid
JOIN (SELECT startedAt, endedAt FROM season WHERE season = ${season}) c
WHERE a.steamid <> b.steamid AND a.team <> b.team
AND a.matchId >= c.startedAt AND a.matchId <= c.endedAt
AND a.deleted = 0 AND b.deleted = 0
GROUP BY a.steamid, b.steamid, a.result
ORDER BY name1, name2, a.result`,
};

const matchesQuery = `SELECT a.matchId, a.map,
GROUP_CONCAT(DISTINCT na.name ORDER BY na.name SEPARATOR ', ') as teamA, a.result as resultA,
GROUP_CONCAT(DISTINCT nb.name ORDER BY nb.name SEPARATOR ', ') as teamB, b.result as resultB,
MAX(r.teamATotal) as teamATotal,
MAX(r.teamBTotal) as teamBTotal,
ABS(MAX(r.teamATotal) - MAX(r.teamBTotal)) as pointDiff,
MAX(s.season) as season,
GROUP_CONCAT(DISTINCT na.steamid ORDER BY na.steamid SEPARATOR ',') as steamidA,
GROUP_CONCAT(DISTINCT nb.steamid ORDER BY nb.steamid SEPARATOR ',') as steamidB
FROM (SELECT * FROM matchlog WHERE team = 0 AND deleted = 0) a
JOIN (SELECT * FROM matchlog WHERE team = 1 AND deleted = 0) b
ON a.matchId = b.matchId
JOIN players na ON a.steamid = na.steamid
JOIN players nb ON b.steamid = nb.steamid
JOIN round r ON a.matchId = r.matchId
JOIN season s ON a.matchId >= s.startedAt AND a.matchId <= s.endedAt
WHERE r.deleted = 0
GROUP BY a.matchId DESC, a.map, a.result, b.result
ORDER BY MIN(a.startedAt), MAX(a.endedAt);`;

const mapWLQuery = 'SELECT steamid, campaign, result, COUNT(result) as count FROM matchlog a JOIN maps b ON a.map = b.map WHERE a.deleted = 0 GROUP BY steamid, campaign, result;';

const mapWLSeasonQuery = season => `SELECT a.steamid as steamid, b.campaign as campaign, a.result as result, COUNT(result) as count
FROM matchlog a
JOIN maps b
ON a.map = b.map
JOIN (SELECT startedAt, endedAt FROM season WHERE season = ${season}) c
WHERE a.deleted = 0 AND a.matchId >= c.startedAt AND a.matchId <= c.endedAt
GROUP BY a.steamid, b.campaign, a.result;`;

const matchIdsQuery = 'SELECT DISTINCT matchId FROM matchlog WHERE deleted = 0 ORDER BY matchId;';

const playerMatchesQuery = 'SELECT DISTINCT matchId, steamid FROM matchlog WHERE deleted = 0 ORDER BY matchId DESC;';

const runMatchAggregateQueries = async (connection, minMatchId, maxMatchId, excludeSteamIds) => {
    const stats = {
        survivor: {},
        infected: {},
    };
    for (const side of sides) {
        for (const [queryType, queryFn] of Object.entries(matchAggregateQueries)) {
            const query = queryFn(side, cols[side], minMatchId, maxMatchId, excludeSteamIds);
            const queryResult = await execQuery(connection, query);
            if (['indTotal', 'indRndAvg', 'indRndPct'].indexOf(queryType) !== -1) {
                stats[side][queryType] = queryResult.results;
            }
            else {
                stats[side][queryType] = queryResult.results[0];
            }
        }

        // calculate z-scores and percentile
        const totalRoundsHeader = `${sideToPrefix(side)}TotalRounds`;
        const roundsArray = stats[side].indTotal.map(row => row[totalRoundsHeader]);
        stats[side].rndAvg[totalRoundsHeader] = getAvg(roundsArray);
        stats[side].stddev[totalRoundsHeader] = getStdDev(roundsArray);
        stats[side].indNorm = [];
        stats[side].indCdf = [];
        for (const row of stats[side].indRndAvg) {
            const rowNorm = {};
            const rowCdf = {};
            for (const [header, value] of Object.entries(row)) {
                if (header === 'name' || header === 'steamid') {
                    rowNorm[header] = value;
                    rowCdf[header] = value;
                }
                else {
                    rowNorm[header] = getZScore(value, stats[side].rndAvg[header], stats[side].stddev[header]);
                    rowCdf[header] = zScoreToPercentile(rowNorm[header]);
                }
            }
            stats[side].indNorm.push(rowNorm);
            stats[side].indCdf.push(rowCdf);
        }
    }

    return stats;
};

const runMatchSingleQueries = async (connection, minMatchId, maxMatchId) => {
    const stats = {
        survivor: {},
        infected: {},
    };

    for (const side of sides) {
        for (const [queryType, queryFn] of Object.entries(matchSingleQueries)) {
            const query = queryFn(side, cols[side], minMatchId, maxMatchId);
            const queryResult = await execQuery(connection, query);
            stats[side][queryType] = queryResult.results;
        }
    }

    stats.teams = (await execQuery(connection, matchTeamsQuery(minMatchId))).results[0];

    stats.round = (await execQuery(connection, matchRoundQuery(minMatchId))).results;
    for (const row of stats.round) {
        row.teamName = row.teamIsA ? 'A' : 'B';
        row.teamRound = row.teamIsA ? row.teamARound : row.teamBRound;
        row.teamTotal = row.teamIsA ? row.teamATotal : row.teamBTotal;
        // make sure first round scores are correct
        if (row.round === 1) {
            row.teamRound = row.teamTotal;
        }
    }

    return stats;
};

const runWlMatrixQuery = async (connection, query) => {
    const { results: players } = await execQuery(connection, playerQuery);
    const data = {};
    const result = await execQuery(connection, query);
    for (const row of result.results) {
        data[row.steamid1] = data[row.steamid1] || {};
        data[row.steamid1][row.steamid2] = data[row.steamid1][row.steamid2] || [0, 0];
        data[row.steamid1][row.steamid2][row.result == 1 ? 0 : 1] = row.count;
    }
    const wl = [];
    const pct = [];
    for (const rp of players) {
        const rowWL = [rp.name];
        const rowPct = [rp.name];
        for (const cp of players) {
            if (rp.steamid == cp.steamid) {
                rowWL.push('');
                rowPct.push('');
            }
            else if (data[rp.steamid]) {
                if (data[rp.steamid][cp.steamid]) {
                    rowWL.push(data[rp.steamid][cp.steamid].join('-'));
                    const total = data[rp.steamid][cp.steamid][0] + data[rp.steamid][cp.steamid][1];
                    if (total) {
                        rowPct.push(Math.round(data[rp.steamid][cp.steamid][0] / total * 100));
                    }
                    else {
                        rowPct.push(0);
                    }
                }
                else {
                    rowWL.push('');
                    rowPct.push('');
                }
            }
            else {
                rowWL.push('');
                rowPct.push('');
            }
        }
        wl.push(rowWL);
        pct.push(rowPct);
    }
    return { headers: [''].concat(players.map(player => player.name)), data: { wl, pct } };
};

const runDamageMatrixQuery = async (connection, query) => {
    const { results: players } = await execQuery(connection, playerQuery);
    const data = {};
    const result = await execQuery(connection, query);
    for (const row of result.results) {
        data[row.aId] = data[row.aId] || {};
        data[row.aId][row.vId] = { total: row.damage, round: +(row.rounddamage).toFixed(2) };
    }
    const total = [];
    const round = [];
    for (const rp of players) {
        const rowTotal = [rp.name];
        const rowRound = [rp.name];
        for (const cp of players) {
            if (data[rp.steamid]) {
                if (data[rp.steamid][cp.steamid]) {
                    rowTotal.push(data[rp.steamid][cp.steamid].total);
                    rowRound.push(data[rp.steamid][cp.steamid].round);
                }
                else {
                    rowTotal.push('');
                    rowRound.push('');
                }
            }
            else {
                rowTotal.push('');
                rowRound.push('');
            }
        }
        total.push(rowTotal);
        round.push(rowRound);
    }
    return { headers: [''].concat(players.map(player => player.name)), data: { total, round } };
};

const runMatchesQuery = async (connection, query) => {
    const mapsQueryResult = await execQuery(connection, mapsQuery);
    const maps = mapsQueryResult.results.reduce((acc, row) => {
        acc[row.map] = row.name;
        return acc;
    }, {});
    const result = await execQuery(connection, query);
    const data = [];
    for (const row of result.results) {
        winner = '=';
        if (row.resultA == -1) winner = '<';
        if (row.resultB == -1) winner = '>';
        data.push([
            row.matchId,
            maps[row.map].slice(0, -2),
            row.teamA,
            row.teamATotal,
            winner,
            row.teamBTotal,
            row.teamB,
            row.pointDiff,
            row.season,
            row.steamidA.split(','),
            row.steamidB.split(',')
        ]);
    }
    return { headers: ['Match ID', 'Map', 'Team A', 'Points A', 'Result', 'Points B', 'Team B', 'Pt. Diff.', 'Season', 'Steam IDs A', 'Steam IDs B'], data };
};

const runPlayersQuery = async (connection, query) => {
    const { results: players } = await execQuery(connection, query);
    return players.map(player => ({ name: player.name, steamid: player.steamid }));
};

const runMapWLQuery = async (connection, query) => {
    const { results: rows } = await execQuery(connection, query);
    return rows.reduce((acc, row) => {
        acc[row.campaign] = acc[row.campaign] || {};
        acc[row.campaign][row.steamid] = acc[row.campaign][row.steamid] || { w: 0, l: 0 };
        acc[row.campaign][row.steamid][row.result === -1 ? 'l' : 'w'] = row.count;
        return acc;
    }, {});
};

const processPlayerMapWL = (players, mapWL) => {
    const steamIdName = players.reduce((acc, row) => {
        acc[row.steamid] = row.name;
        return acc;
    }, {});
    const steamIds = players.map(row => row.steamid);
    const maps = Object.keys(mapWL).sort();
    const data = [];
    for (const steamId of steamIds) {
        const row = [];
        let w = 0;
        let l = 0;
        for (const map of maps) {
            mapWL[map][steamId] = mapWL[map][steamId] || { w: 0, l: 0 };
            w += mapWL[map][steamId].w;
            l += mapWL[map][steamId].l;
            if (mapWL[map][steamId].w > 0 || mapWL[map][steamId].l > 0) {
                row.push(mapWL[map][steamId].w);
                row.push(mapWL[map][steamId].l);
            }
            else {
                row.push(null, null);
            }
            const n = mapWL[map][steamId].w + mapWL[map][steamId].l;
            row.push(n === 0 ? null : Math.round(mapWL[map][steamId].w / n * 100));
        }
        data.push([steamIdName[steamId], w + l, w, l, w + l === 0 ? null : Math.round(w / (w + l) * 100)].concat(row));
    }
    return {
        data,
        headers: ['Name', 'Total', 'W', 'L', 'Win %'].concat(maps.reduce((acc, map) => {
            acc.push(map, map, map);
            return acc;
        }, [])),
        nestedHeaders: [
            ['', { label: '', colspan: 4 }].concat(maps.reduce((acc, map) => {
                acc.push({ label: map, colspan: 3 });
                return acc;
            }, [])),
            ['Name', 'Total', 'W', 'L', 'Win %'].concat(maps.reduce((acc, map) => {
                acc.push('W', 'L', 'Win %');
                return acc;
            }, [])),
        ],
    };
};

const statTypes = ['single', 'cumulative'];
const queryTypes = ['indTotal', 'indRndAvg', 'indRndPct', 'indNorm', 'indCdf'];
const pvpTypes = ['pvp_ff', 'pvp_infdmg'];

const processRoundsMatches = async (connection, matchIds, matchStats) => {
    const singleStats = {};

    // process match stats
    logger.info(`Processing match stats... ${matchIds.length}`);
    let i = 0;
    for (const matchId of matchIds) {
        i++;
        logger.info(`Processing match stats... ${i}/${matchIds.length}. cached ${matchId in matchStats}`);
        const stats = await runMatchAggregateQueries(connection, matchId, matchId);
        if (!(matchId in matchStats)) {
            matchStats[matchId] = await runMatchSingleQueries(connection, matchId, matchId);
            for (const side of sides) {
                matchStats[matchId][side].total = stats[side].indTotal;
                matchStats[matchId][side].rndAvg = stats[side].indRndAvg;
                matchStats[matchId][side].pct = stats[side].indRndPct;
            }

            for (const pvpType of pvpTypes) {
                matchStats[matchId][pvpType] = (await execQuery(connection, pvpQueries.match(pvpType, matchId))).results;
            }
        }

        singleStats[matchId] = stats;
    }

    return { singleStats };
}

const processRoundsLeagues = async (connection, matchIds, leagueStats) => {
    // process league stats
    logger.info(`Processing league stats... ${matchIds.length}`);
    let i = 0;
    for (const matchId of matchIds) {
        i++;
        logger.info(`Processing league stats... ${i}/${matchIds.length}. cached ${matchId in leagueStats}`);
        if (!(matchId in leagueStats)) {
            leagueStats[matchId] = await runMatchAggregateQueries(connection, undefined, matchId);
            leagueStats[matchId].rankings = processRankings(leagueStats[matchId], columns);
        }
    }
}

const processRoundsSeasons = async (connection, matchIds, seasons, seasonStats, excludeSteamIds) => {
    const getSeason = matchId => seasons.find(season => season.startedAt <= matchId && season.endedAt >= matchId);

    // process season stats
    logger.info(`Processing season stats... ${matchIds.length}`);
    let i = 0;
    for (const matchId of matchIds) {
        i++;
        logger.info(`Processing season stats... ${i}/${matchIds.length}. cached ${matchId in seasonStats}`);
        if (!(matchId in seasonStats)) {
            const season = getSeason(matchId);
            seasonStats[matchId] = await runMatchAggregateQueries(connection, season.startedAt, matchId, season.endedAt === 2147483647 ? excludeSteamIds : []);
            seasonStats[matchId].rankings = processRankings(seasonStats[matchId], columns);
        }
    }
}

const processRoundsPlayers = async (connection, matchIds, incremental, singleStats, leagueStats) => {
    const createNewStatsRow = () => queryTypes.reduce((acc, queryType) => {
        acc[queryType] = [];
        return acc;
    }, {});

    const playerStats = {};

    // generate mapping of players to matchIds they've played in
    const playerMatches = {};
    const { results: playerMatchIds } = await execQuery(connection, playerMatchesQuery);
    for (const row of playerMatchIds) {
        const matchId = row.matchId;
        const steamId = row.steamid;
        playerMatches[steamId] = playerMatches[steamId] || {};
        playerMatches[steamId][matchId] = 1;
    }

    // process player stats
    logger.info(`Processing player stats... ${matchIds.length}`);
    let i = 0;
    for (const matchId of matchIds) {
        i++;
        logger.info(`Processing player stats... ${i}/${matchIds.length}`);
        for (const statType of statTypes) {
            const stats = statType === 'single' ? singleStats : leagueStats;
            for (const side of sides) {
                for (const queryType of queryTypes) {
                    for (const row of stats[matchId][side][queryType]) {
                        if (playerMatches[row.steamid] && playerMatches[row.steamid][matchId]) {
                            playerStats[row.steamid] = playerStats[row.steamid] || {
                                single: {
                                    survivor: createNewStatsRow(),
                                    infected: createNewStatsRow(),
                                },
                                cumulative: {
                                    survivor: createNewStatsRow(),
                                    infected: createNewStatsRow(),
                                },
                                recent: {
                                    survivor: createNewStatsRow(),
                                    infected: createNewStatsRow(),
                                },
                            };
                            row.matchId = matchId;
                            playerStats[row.steamid][statType][side][queryType].push(row);
                        }
                    }
                }
            }
        }
    }

    // generate moving average player stats, n=5
    const cache = {};
    let cacheHits = 0;
    let cacheMisses = 0;
    logger.info(`Processing player moving average stats... ${Object.entries(playerMatches).length}`);
    for (const [steamId, matches] of Object.entries(playerMatches)) {
        const pMatchIds = Object.keys(matches).map(matchId => parseInt(matchId)).sort();
        for (let i = 0; i < pMatchIds.length; i++) {
            const endMatchId = pMatchIds[i];
            if (!incremental || matchIds.indexOf(endMatchId) !== -1) {
                if (i >= 4 && (pMatchIds.length < 9 || pMatchIds.length - pMatchIds.indexOf(endMatchId) <= 5)) {
                    const startMatchId = pMatchIds[i - 4];
                    let stats;
                    if (!cache[startMatchId] || !cache[startMatchId][endMatchId]) {
                        stats = await runMatchAggregateQueries(connection, startMatchId, endMatchId);
                        cache[startMatchId] = cache[startMatchId] || {};
                        cache[startMatchId][endMatchId] = stats;
                        cacheMisses++;
                    }
                    else {
                        cacheHits++;
                        stats = cache[startMatchId][endMatchId];
                    }
                    for (const side of sides) {
                        for (const queryType of Object.keys(stats[side])) {
                            if (queryTypes.indexOf(queryType) !== -1) {
                                for (const row of stats[side][queryType]) {
                                    if (row.steamid === steamId && playerMatches[row.steamid][endMatchId]) {
                                        row.matchId = endMatchId;
                                        playerStats[row.steamid].recent[side][queryType].push(row);
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    for (const side of sides) {
                        for (const queryType of queryTypes) {
                            if (playerStats[steamId]) {
                                playerStats[steamId].recent[side][queryType].push({ matchId: endMatchId });
                            }
                        }
                    }
                }
            }
        }
    }
    logger.debug(`${cacheHits} cache hits. ${cacheMisses} cache misses`);

    return { playerStats };
};

const mergePlayerStats = (a, b) => {
    const data = {};
    for (const statType of statTypes.concat('recent')) {
        data[statType] = {};
        for (const side of sides) {
            data[statType][side] = {};
            for (const queryType of queryTypes) {
                // push b values into a if doesn't exist already
                data[statType][side][queryType] = a[statType][side][queryType].slice(0);
                for (const row of b[statType][side][queryType]) {
                    if (!data[statType][side][queryType].find(r => r.matchId === row.matchId)) {
                        data[statType][side][queryType].push(row);
                    }
                }
                // sort values in case b is not the last played match
                data[statType][side][queryType].sort((a, b) => a.matchId - b.matchId);
            }
        }
    }
    return data;
};

const getLastTableUpdateTimes = async (connection, database) => {
    const result = await execQuery(connection, lastTableUpdateTimesQuery(database));
    return result.results.reduce((acc, row) => {
        acc[row.tableName] = row.updateTime ? row.updateTime.getTime() : Date.now();
        return acc;
    }, {});
};

const giveMatchReward = async (matchIds, amount, startingAmount) => {
    const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    });
    connection.connect();
    
    for (const matchId of matchIds) {
        logger.info(`Giving match reward ${matchId}, ${amount}, ${startingAmount}`);
        await execQuery(connection, `CALL give_match_reward(1,${matchId},${amount},${startingAmount});`);
    }
    
    connection.end();
};

const generateData = async (increment, matchIds, dataDir) => {
    const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    });
    connection.connect();

    await Promise.each([
        path.join(dataDir, 'league/'),
        path.join(dataDir, 'matches/'),
        path.join(dataDir, 'players/'),
        path.join(dataDir, 'season/'),
    ], async dir => fs.ensureDir(dir));

    logger.info('Inserting unknown players...');
    await execQuery(connection, insertUnknownPlayersQuery);

    logger.info('Executing set_derived_columns stored procedure...');
    await execQuery(connection, 'CALL set_derived_columns();');

    logger.info('Executing fix_round stored procedure...');
    await execQuery(connection, 'CALL fix_round(1);');

    logger.info('Writing seasons.json...');
    const seasons = (await execQuery(connection, seasonQuery)).results;
    await fs.writeJson(path.join(dataDir, 'seasons.json'), seasons);

    const matches = await runMatchesQuery(connection, matchesQuery);
    logger.info('Writing matches.json...');
    await fs.writeJson(path.join(dataDir, 'matches.json'), matches);

    const players = await runPlayersQuery(connection, playerQuery);
    logger.info('Writing players.json...');
    await fs.writeJson(path.join(dataDir, 'players.json'), players);

    const mapWL = await runMapWLQuery(connection, mapWLQuery);
    const playerMapWL = processPlayerMapWL(players, mapWL);
    logger.info('Writing playerMapWL.json...');
    await fs.writeJson(path.join(dataDir, 'playerMapWL.json'), playerMapWL);

    const wlMatrix = {
        with: await runWlMatrixQuery(connection, wlMatrixQueries.with),
        against: await runWlMatrixQuery(connection, wlMatrixQueries.against),
    };
    logger.info('Writing wlMatrix.json...');
    await fs.writeJson(path.join(dataDir, 'wlMatrix.json'), wlMatrix);

    const damageMatrix = {};
    for (const pvpType of pvpTypes) {
        damageMatrix[pvpType] = await runDamageMatrixQuery(connection, pvpQueries.league(pvpType));
    }
    logger.info('Writing damageMatrix.json...');
    await fs.writeJson(path.join(dataDir, 'damageMatrix.json'), damageMatrix);

    for (const season of seasons) {
        let filename;
        const seasonNum = season.season;
        const seasonDir = path.join(dataDir, 'season', seasonNum.toString());
        
        await fs.ensureDir(seasonDir);
        
        const wlMatrixSeason = {
            with: await runWlMatrixQuery(connection, wlMatrixSeasonQueries.with(seasonNum)),
            against: await runWlMatrixQuery(connection, wlMatrixSeasonQueries.against(seasonNum)),
        };
        filename = path.join(seasonDir, 'wlMatrixSeason.json');
        logger.info(`Writing ${filename}...`);
        await fs.writeJson(filename, wlMatrixSeason);

        const damageMatrixSeason = {};
        for (const pvpType of pvpTypes) {
            damageMatrixSeason[pvpType] = await runDamageMatrixQuery(connection, pvpSeasonQueries.league(pvpType, seasonNum));
        }
        filename = path.join(seasonDir, 'damageMatrixSeason.json');
        logger.info(`Writing ${filename}...`);
        await fs.writeJson(filename, damageMatrixSeason);

        const mapWLSeason = await runMapWLQuery(connection, mapWLSeasonQuery(seasonNum));
        const playerMapWLSeason = processPlayerMapWL(players, mapWLSeason);
        filename = path.join(seasonDir, 'playerMapWLSeason.json');
        logger.info(`Writing ${filename}...`);
        await fs.writeJson(filename, playerMapWLSeason);
    }

    if (!increment) {
        matchIds = (await execQuery(connection, matchIdsQuery)).results.map(row => row.matchId);
    }

    logger.info('Loading existing match, league, and season data...');
    const matchStats = {};
    const leagueStats = {};
    const seasonStats = {};
    let i = 0;
    for (const matchId of matchIds) {
        i++;
        logger.info(`Loading existing match, league, and season data... ${i}/${matchIds.length}`);
        const matchPath = path.join(dataDir, `matches/${matchId}.json`);
        const leaguePath = path.join(dataDir, `league/${matchId}.json`);
        const seasonPath = path.join(dataDir, `season/${matchId}.json`);
        if (await fs.pathExists(matchPath)) {
            matchStats[matchId] = await fs.readJson(matchPath);
        }
        if (await fs.pathExists(leaguePath)) {
            leagueStats[matchId] = await fs.readJson(leaguePath);
        }
        if (matchId < 1657329851) {
            if (await fs.pathExists(seasonPath)) {
                seasonStats[matchId] = await fs.readJson(seasonPath);
            }
        }

    }

    logger.info('Loading season steamid excludion list...');
    const excludeSteamIds = await fs.readJson('excluded_steamids.json');
    for (const steamId of excludeSteamIds) {
        logger.info(`Excluding ${steamId}`);
    }

    logger.info('Processing rounds...');
    const { singleStats } = await processRoundsMatches(connection, matchIds, matchStats);
    await processRoundsLeagues(connection, matchIds, leagueStats);
    await processRoundsSeasons(connection, matchIds, seasons, seasonStats, excludeSteamIds);
    const { playerStats } = await processRoundsPlayers(connection, matchIds, increment, singleStats, leagueStats)

    logger.info('Adding trueskill to league stats...');
    processTrueskill(matches, leagueStats, increment, matchIds, []);

    logger.info('Adding trueskill to season stats...');
    processTrueskill(matches, seasonStats, increment, matchIds, seasons);

    i = 0;
    for (const [matchId, data] of Object.entries(leagueStats)) {
        i++;
        if (matchId < 1657329851) continue;
        logger.info(`Writing league/${matchId}.json... ${i}/${Object.entries(leagueStats).length}`);
        await fs.writeJson(path.join(dataDir, `league/${matchId}.json`), data);
    }

    i = 0;
    for (const [matchId, data] of Object.entries(seasonStats)) {
        i++;
        if (matchId < 1657329851) continue;
        logger.info(`Writing season/${matchId}.json... ${i}/${Object.entries(seasonStats).length}`);
        await fs.writeJson(path.join(dataDir, `season/${matchId}.json`), data);
    }

    logger.info('Writing league.json and season.json...');
    const latestLeagueMatchId = matches.data[matches.data.length - 1][0];
    await fs.copy(path.join(dataDir, `league/${latestLeagueMatchId}.json`), path.join(dataDir, 'league.json'));
    await fs.copy(path.join(dataDir, `season/${latestLeagueMatchId}.json`), path.join(dataDir, 'season.json'));

    i = 0;
    for (const [steamid, data] of Object.entries(playerStats)) {
        i++;
        logger.info(`Writing players/${steamid}.json... ${i}/${Object.entries(playerStats).length}`);
        const filepath = path.join(dataDir, `players/${steamid}.json`);
        if (increment && await fs.pathExists(filepath)) {
            const currData = await fs.readJson(filepath);
            const newData = mergePlayerStats(currData, data);
            await fs.writeJson(filepath, newData);
        }
        else {
            await fs.writeJson(filepath, data);
        }
    }

    i = 0;
    for (const [matchId, data] of Object.entries(matchStats)) {
        i++;
        if (matchId < 1657329851) continue;
        logger.info(`Writing matches/${matchId}.json... ${i}/${Object.entries(matchStats).length}`);
        await fs.writeJson(path.join(dataDir, `matches/${matchId}.json`), data);
    }

    const tableTimestamps = await getLastTableUpdateTimes(connection, process.env.DB_NAME);
    const timestamps = {
        league: Math.max(tableTimestamps.survivor, tableTimestamps.infected, tableTimestamps.players),
        wlMatrix: Math.max(tableTimestamps.matchlog, tableTimestamps.players),
        damageMatrix: Math.max(tableTimestamps.pvp_ff, tableTimestamps.pvp_infdmg, tableTimestamps.players),
        matches: Math.max(tableTimestamps.matchlog, tableTimestamps.players),
        players: tableTimestamps.players,
        playerMapWL: Math.max(tableTimestamps.matchlog, tableTimestamps.maps, tableTimestamps.players),
    };

    logger.info('Writing timestamp.json...');
    await fs.writeJson(path.join(dataDir, 'timestamps.json'), timestamps);

    connection.end();

    await discordConfig.load();
    const mmrCfgFilePath = discordConfig.settings.tankOrder.mmrCfgFilePath;
    logger.info(`Writing ${mmrCfgFilePath}...`);
    const seasonData = await fs.readJson(path.join(dataDir, 'season.json'));
    const rankings = seasonData.rankings;
    rankings.sort((a, b) => b.combined - a.combined);
    await fs.writeFile(mmrCfgFilePath, rankings.map(player => `mmr_tank_control "${player.steamid}" "${player.combined}"`).join('\n'));
};

const spawnP = async (cmd, args = []) => new Promise((resolve, reject) => {
    const ls = spawn(cmd, args);
    ls.stdout.on('data', (data) => {
        logger.info(`${data}`);
    });

    ls.stderr.on('data', (data) => {
        logger.info(`${data}`);
    });

    ls.on('close', (code) => {
        resolve(code);
    });
});

const main = async (init = false, initDatabaseOpt = false, seed = false, buildOpt = false, watchOpt = false, buildCssOpt = false, buildJsOpt = false, increment = false, production = false, matchIds = [], publicDirOverride, dataDirOverride, generateDataOpt = false, renderTemplateOpt = false, giveOpt = false) => {
    if (envConfig.error) {
        logger.info('.env file missing. Running .env setup...');
        await envWizard();
    }

    const publicDir = publicDirOverride || process.env.PUBLIC_DIR;
    const dataDir = dataDirOverride || process.env.DATA_DIR;

    logger.info('Options:');
    logger.info(`init: ${init}`);
    logger.info(`initDatabaseOpt: ${initDatabaseOpt}`);
    logger.info(`seed: ${seed}`);
    logger.info(`buildOpt: ${buildOpt}`);
    logger.info(`watchOpt: ${watchOpt}`);
    logger.info(`buildCssOpt: ${buildCssOpt}`);
    logger.info(`buildJsOpt: ${buildJsOpt}`);
    logger.info(`increment: ${increment}`);
    logger.info(`production: ${production}`);
    logger.info(`matchIds: ${JSON.stringify(matchIds)}`);
    logger.info(`publicDir: ${publicDir}`);
    logger.info(`dataDir: ${dataDir}`);
    logger.info(`generateDataOpt: ${generateDataOpt}`);
    logger.info(`renderTemplateOpt: ${renderTemplateOpt}`);
    logger.info(`giveOpt: ${giveOpt}`);
    logger.info(`process.env.DB_NAME: ${process.env.DB_NAME}`);

    await fs.ensureDir(publicDir);
    await fs.ensureDir(dataDir);

    if (init) {
        logger.info(`Initializing ${publicDir}...`);
        await fs.copy(path.join(__dirname, 'src/public'), publicDir);
    }

    if (initDatabaseOpt) {
        await spawnP(path.join(__dirname, 'sql/init.sh'));
    }

    if (seed) {
        await spawnP(path.join(__dirname, 'sql/seed.sh'));
    }

    if (generateDataOpt) {
        await generateData(increment, matchIds, dataDir);
    }
    
    if (giveOpt) {
        await discordConfig.load();
        await giveMatchReward(matchIds, discordConfig.settings.matchRewardAmount, discordConfig.settings.bankrollStartingAmount);
    }

    if (renderTemplateOpt || watchOpt) {
        logger.info('Rendering template...');
        await renderTemplate(production, publicDir, dataDir);
    }

    if (buildOpt || buildJsOpt || watchOpt) {
        await buildJs(publicDir, watchOpt);
    }

    if (buildOpt || buildCssOpt || watchOpt) {
        await buildCss(publicDir);
    }

    if (production) {
        await rev(publicDir);
    }

    if (watchOpt) {
        logger.info('Watch for css file changes...');
        const cssWatcher = chokidar.watch(path.join(__dirname, 'src/css'), {
            persistent: true,
            awaitWriteFinish: true,
        });
        cssWatcher.on('change', async (path) => {
            logger.info(`Css file ${path} has been changed.`);
            await buildCss(publicDir);
        });
        logger.info('Watch for template file changes...');
        const templateWatcher = chokidar.watch(path.join(__dirname, 'src/templates'), {
            persistent: true,
            awaitWriteFinish: true,
        });
        templateWatcher.on('change', async (path) => {
            logger.info(`Template file ${path} has been changed.`);
            await renderTemplate(false, publicDir, dataDir);
        });
    }

    logger.info('Done.');
};

program
    .version(pjson.version)
    .option('--init', 'Initialize public directory assets')
    .option('--init-database', 'Initialize database')
    .option('--seed', 'Seed database')
    .option('-b, --build', 'Build js and css')
    .option('-w, --watch', 'Watch source files and rebuild on change')
    .option('--build-css', 'Build css')
    .option('--build-js', 'Build js')
    .option('--public-dir <path>', 'Public output directory')
    .option('--data-dir <path>', 'Data output directory')
    .option('-p, --production', 'Production mode. Use hashed js/css files')
    .option('-i, --increment', 'Incremental data update')
    .option('-d, --data', 'Generate data')
    .option('-g, --give', 'Give match reward')
    .option('-t, --template', 'Render template');

program.parse(process.argv);
main(program.init, program.initDatabase, program.seed, program.build, program.watch, program.buildCss, program.buildJs, program.increment, program.production, program.args.map(matchId => parseInt(matchId)), program.publicDir, program.dataDir, program.data, program.template, program.give);
// main(true, []); // no updates to data folder
// main(true, [matchId1, matchId2, ...]); // incremental update of data folder
// main(false, []); // full update of data folder
