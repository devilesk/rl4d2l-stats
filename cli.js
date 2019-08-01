#!/usr/bin/env node

require('dotenv').config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' });
const mysql = require('mysql');
const fs = require('fs-extra');
const path = require('path');
const survivorHeaderData = require("./src/data/survivor.json");
const infectedHeaderData = require("./src/data/infected.json");
const maps = require("./src/data/maps.json");
const columns = require("./src/data/columns.json");
const program = require('commander');
const pjson = require('./package.json');
const buildCss = require('./build-css');
const buildJs = require('./build-js');
const rev = require('./rev');
const chokidar = require('chokidar');
const Promise = require('bluebird');
const util = require('util');
const { spawn } = require('child_process');
const renderTemplate = require('./src/cli/renderTemplate');
const processRankings = require('./src/common/processRankings');
const { getAvg, getStdDev, getZScore, zScoreToPercentile } = require('./src/common/util');

const cols = {
    survivor: Object.keys(survivorHeaderData).filter(header => survivorHeaderData[header] != null && header != 'steamid' && header != 'plyTotalRounds'),
    infected: Object.keys(infectedHeaderData).filter(header => infectedHeaderData[header] != null && header != 'steamid' && header != 'infTotalRounds'),
};

const sideToPrefix = side => side == 'survivor' ? 'ply' : 'inf';

const sides = ['survivor', 'infected'];

const execQuery = async (connection, query) => {
    return new Promise((resolve, reject) => {
        connection.query(query, function (err, results, fields) {
            if (err) {
                reject(err);
            }
            else {
                resolve({ results, fields });
            }
        });
    });
};

const insertUnknownPlayersQuery = `INSERT INTO players (steamid, name)
SELECT a.steamid, a.steamid FROM survivor a LEFT JOIN players b ON a.steamid = b.steamid WHERE b.steamid IS NULL
UNION SELECT a.steamid, a.steamid FROM infected a LEFT JOIN players b ON a.steamid = b.steamid WHERE b.steamid IS NULL
UNION SELECT a.steamid, a.steamid FROM matchlog a LEFT JOIN players b ON a.steamid = b.steamid WHERE b.steamid IS NULL
UNION SELECT a.steamid, a.steamid FROM pvp_ff a LEFT JOIN players b ON a.steamid = b.steamid WHERE b.steamid IS NULL
UNION SELECT a.steamid, a.steamid FROM pvp_infdmg a LEFT JOIN players b ON a.steamid = b.steamid WHERE b.steamid IS NULL;`;

const lastTableUpdateTimesQuery = database => `SELECT TABLE_NAME as tableName, UPDATE_TIME as updateTime FROM information_schema.tables WHERE TABLE_SCHEMA = '${database}';`;

const matchAggregateQueries = {
    total:     (tableName, cols, conditions='') => `SELECT ''     as name,''        as steamid,COUNT(*) as ${sideToPrefix(tableName)}TotalRounds,${cols.map(col => `SUM(${col})    as ${col}`).join(',')} FROM ${tableName} a WHERE deleted = 0 ${conditions};`,
    avg:       (tableName, cols, conditions='') => `SELECT ''     as name,''        as steamid,COUNT(*) as ${sideToPrefix(tableName)}TotalRounds,${cols.map(col => `AVG(${col})    as ${col}`).join(',')} FROM ${tableName} a WHERE deleted = 0 ${conditions};`,
    stddev:    (tableName, cols, conditions='') => `SELECT ''     as name,''        as steamid,COUNT(*) as ${sideToPrefix(tableName)}TotalRounds,${cols.map(col => `STDDEV(${col}) as ${col}`).join(',')} FROM ${tableName} a WHERE deleted = 0 ${conditions};`,
    indTotal:  (tableName, cols, conditions='') => `SELECT b.name as name,a.steamid as steamid,COUNT(*) as ${sideToPrefix(tableName)}TotalRounds,${cols.map(col => `SUM(a.${col})    as ${col}`).join(',')} FROM ${tableName} a JOIN players b ON a.steamid = b.steamid WHERE a.deleted = 0 ${conditions} GROUP BY a.steamid, b.name ORDER BY b.name;`,
    indAvg:    (tableName, cols, conditions='') => `SELECT b.name as name,a.steamid as steamid,COUNT(*) as ${sideToPrefix(tableName)}TotalRounds,${cols.map(col => `AVG(a.${col})    as ${col}`).join(',')} FROM ${tableName} a JOIN players b ON a.steamid = b.steamid WHERE a.deleted = 0 ${conditions} GROUP BY a.steamid, b.name ORDER BY b.name;`,
    indRndPct: (tableName, cols, conditions='') => `SELECT c.name as name,a.steamid as steamid,COUNT(*) as ${sideToPrefix(tableName)}TotalRounds,${cols.map(col => `AVG(a.${col} / b.${col} * 100) as ${col}`).join(',')}
FROM ${tableName} a
JOIN (SELECT matchId, round, isSecondHalf, ${cols.map(col => `SUM(${col}) as ${col}`).join(',')} FROM ${tableName} WHERE deleted = 0 GROUP BY matchId, round, isSecondHalf) b
ON a.matchId = b.matchId AND a.round = b.round AND a.isSecondHalf = b.isSecondHalf
JOIN players c ON a.steamid = c.steamid
WHERE a.deleted = 0 ${conditions}
GROUP BY steamid, name
ORDER BY c.name;`
};

const matchSingleQueries = {
    rndTotal:  (tableName, cols, conditions='') => `SELECT b.name as name,a.steamid as steamid,a.round as round,${cols.map(col => `a.${col}    as ${col}`).join(',')} FROM ${tableName} a JOIN players b ON a.steamid = b.steamid WHERE a.deleted = 0 ${conditions} ORDER BY a.round, a.isSecondHalf, b.name;`,
    rndPct: (tableName, cols, conditions='') => `SELECT c.name as name,a.steamid as steamid,a.round as round,${cols.map(col => `a.${col} / b.${col} * 100 as ${col}`).join(',')}
FROM ${tableName} a
JOIN (SELECT matchId, round, isSecondHalf, ${cols.map(col => `SUM(${col}) as ${col}`).join(',')} FROM ${tableName} WHERE deleted = 0 GROUP BY matchId, round, isSecondHalf) b
ON a.matchId = b.matchId AND a.round = b.round AND a.isSecondHalf = b.isSecondHalf
JOIN players c ON a.steamid = c.steamid
WHERE a.deleted = 0 ${conditions}
ORDER BY a.round, a.isSecondHalf, c.name;`
};

const pvpQueries = {
    match: (tableName, matchId) => `SELECT a.round as round, a.steamid as aId, b.name as attacker, a.victim as vId, c.name as victim, SUM(a.damage) as damage
FROM ${tableName} a JOIN players b ON a.steamid = b.steamid JOIN players c ON a.victim = c.steamid
WHERE a.deleted = 0 AND a.matchId = ${matchId}
GROUP BY a.matchId, a.round, a.steamid, a.victim, b.name, c.name;`,
    league: (tableName) => `SELECT a.steamid as aId, b.name as attacker, a.victim as vId, c.name as victim, SUM(a.damage) as damage, SUM(a.damage) / COUNT(a.damage) as rounddamage
FROM ${tableName} a JOIN players b ON a.steamid = b.steamid JOIN players c ON a.victim = c.steamid
WHERE a.deleted = 0
GROUP BY a.steamid, a.victim, b.name, c.name;`
}

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
GROUP BY a.steamid, b.steamid, a.result
ORDER BY name1, name2, a.result`,
    against: `SELECT MAX(na.name) as name1, MAX(nb.name) as name2, a.steamid as steamid1, b.steamid as steamid2, a.result as result, COUNT(a.result) as count
FROM matchlog a
JOIN matchlog b ON a.matchId = b.matchId
JOIN players na ON a.steamid = na.steamid
JOIN players nb ON b.steamid = nb.steamid
WHERE a.steamid <> b.steamid AND a.team <> b.team
GROUP BY a.steamid, b.steamid, a.result
ORDER BY name1, name2, a.result`
};

const matchesQuery = `SELECT a.matchId, a.map,
GROUP_CONCAT(DISTINCT na.name ORDER BY na.name SEPARATOR ', ') as teamA, a.result as resultA,
GROUP_CONCAT(DISTINCT nb.name ORDER BY nb.name SEPARATOR ', ') as teamB, b.result as resultB
FROM (SELECT * FROM matchlog WHERE team = 0) a
JOIN (SELECT * FROM matchlog WHERE team = 1) b
ON a.matchId = b.matchId
JOIN players na ON a.steamid = na.steamid
JOIN players nb ON b.steamid = nb.steamid
GROUP BY a.matchId DESC, a.map, a.result, b.result
ORDER BY MIN(a.startedAt), MAX(a.endedAt);`;

const mapWLQuery = `SELECT steamid, campaign, result, COUNT(result) as count FROM matchlog a JOIN maps b ON a.map = b.map GROUP BY steamid, campaign, result;`;

const matchIdsQuery = `SELECT DISTINCT matchId FROM matchlog WHERE deleted = 0 ORDER BY matchId;`;

const runMatchAggregateQueries = async (connection, condition='') => {
    const stats = {
        survivor: {},
        infected: {},
    };
    for (const side of sides) {
        for (let [queryType, queryFn] of Object.entries(matchAggregateQueries)) {
            const query = queryFn(side, cols[side], condition);
            const queryResult = await execQuery(connection, query);
            if (['indTotal', 'indAvg', 'indRndPct'].indexOf(queryType) !== -1) {
                stats[side][queryType] = queryResult.results;
            }
            else {
                stats[side][queryType] = queryResult.results[0];
            }
        }
        
        // calculate z-scores and percentile
        const totalRoundsHeader = `${sideToPrefix(side)}TotalRounds`;
        const roundsArray = stats[side].indTotal.map(row => row[totalRoundsHeader]);
        stats[side].avg[totalRoundsHeader] = getAvg(roundsArray);
        stats[side].stddev[totalRoundsHeader] = getStdDev(roundsArray);
        stats[side].indNorm = [];
        stats[side].indCdf = [];
        for (const row of stats[side].indAvg) {
            const rowNorm = {};
            const rowCdf = {};
            for (let [header, value] of Object.entries(row)) {
                if (header === 'name' || header === 'steamid') {
                    rowNorm[header] = value;
                    rowCdf[header] = value;
                }
                else {
                    rowNorm[header] = getZScore(value, stats[side].avg[header], stats[side].stddev[header]);
                    rowCdf[header] = zScoreToPercentile(rowNorm[header]);
                }
            }
            stats[side].indNorm.push(rowNorm);
            stats[side].indCdf.push(rowCdf);
        }
    }
    
    return stats;
};

const runMatchSingleQueries = async (connection, condition='') => {
    const stats = {
        survivor: {},
        infected: {},
    };
    
    for (const side of sides) {
        for (let [queryType, queryFn] of Object.entries(matchSingleQueries)) {
            const query = queryFn(side, cols[side], condition);
            const queryResult = await execQuery(connection, query);
            stats[side][queryType] = queryResult.results;
        }
    }
    
    return stats;
}

const runWlMatrixQuery = async (connection, query) => {
    const { results: players } = await execQuery(connection, playerQuery);
    const data = {};
    const result = await execQuery(connection, query);
    for (const row of result.results) {
        data[row.steamid1] = data[row.steamid1] || {};
        data[row.steamid1][row.steamid2] = data[row.steamid1][row.steamid2] || [0,0];
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
            winner,
            row.teamB
        ]);
    }
    return { headers: ['Match ID', 'Map', 'Team A', 'Result', 'Team B'], data }
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
            const n = mapWL[map][steamId].w+mapWL[map][steamId].l;
            row.push(n === 0 ? null : Math.round(mapWL[map][steamId].w / n * 100));
        }
        data.push([steamIdName[steamId], w+l, w, l, w+l === 0 ? null : Math.round(w / (w+l) * 100)].concat(row));
    }
    return {
        data,
        headers: ['Name', 'Total', 'W', 'L', 'Win %'].concat(maps.reduce((acc, map) => {
            acc.push(map, map, map);
            return acc;
        }, [])),
        nestedHeaders: [
            ['', {label: '', colspan: 4}].concat(maps.reduce((acc, map) => {
                acc.push({label: map, colspan: 3});
                return acc;
            }, [])),
            ['Name', 'Total', 'W', 'L', 'Win %'].concat(maps.reduce((acc, map) => {
                acc.push('W', 'L', 'Win %');
                return acc;
            }, []))
        ]
    };
}

const statTypes = ['single', 'cumulative'];
const queryTypes = ['indTotal', 'indAvg', 'indRndPct', 'indNorm', 'indCdf'];
const pvpTypes = ['pvp_ff', 'pvp_infdmg'];

const processRounds = async (connection, incremental, _matchIds) => {
    let matchIds = _matchIds;
    if (!incremental) {
        matchIds = (await execQuery(connection, matchIdsQuery)).results.map(row => row.matchId);
    }
    const createNewStatsRow = () => queryTypes.reduce((acc, queryType) => {
        acc[queryType] = []
        return acc;
    }, {});
    const singleStats = {};
    const matchStats = {};
    const playerStats = {};
    const leagueStats = {};
    
    // process match stats
    console.log('Processing match stats...', matchIds.length);
    for (const matchId of matchIds) {
        const condition = `AND a.matchId = ${matchId}`;
        matchStats[matchId] = await runMatchSingleQueries(connection, condition);
        const stats = await runMatchAggregateQueries(connection, condition);
        for (const side of sides) {
            matchStats[matchId][side].total = stats[side].indTotal;
            matchStats[matchId][side].avg = stats[side].indAvg;
            matchStats[matchId][side].pct = stats[side].indRndPct;
        }
        
        for (const pvpType of pvpTypes) {
            matchStats[matchId][pvpType] = (await execQuery(connection, pvpQueries.match(pvpType, matchId))).results;
        }
        
        singleStats[matchId] = stats;
    }
    
    // process league stats
    console.log('Processing league stats...', matchIds.length);
    for (const matchId of matchIds) {
        const condition = `AND a.matchId <= ${matchId}`;
        leagueStats[matchId] = await runMatchAggregateQueries(connection, condition);
        leagueStats[matchId].rankings = processRankings(leagueStats[matchId], columns);
    }
    
    // generate mapping of players to matchIds they've played in
    const playerMatches = {};
    const playerMatchesQuery = `SELECT DISTINCT matchId, steamid FROM matchlog WHERE deleted = 0 ORDER BY matchId DESC;`;
    const { results: playerMatchIds } = await execQuery(connection, playerMatchesQuery);
    for (const row of playerMatchIds) {
        const matchId = row.matchId;
        const steamId = row.steamid;
        playerMatches[steamId] = playerMatches[steamId] || {};
        playerMatches[steamId][matchId] = 1;
    }
    
    // process player stats
    console.log('Processing player stats...', matchIds.length);
    for (const matchId of matchIds) {
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
                                }
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
    console.log('Processing player moving average stats...', Object.entries(playerMatches).length);
    for (let [steamId, matches] of Object.entries(playerMatches)) {
        const pMatchIds = Object.keys(matches).map(matchId => parseInt(matchId)).sort();
        for (let i = 0; i < pMatchIds.length; i++) {
            const endMatchId = pMatchIds[i];
            if (!incremental || matchIds.indexOf(endMatchId) !== -1) {
                if (i >= 4) {
                    const startMatchId = pMatchIds[i - 4];
                    const condition = `AND a.matchId >= ${startMatchId} AND a.matchId <= ${endMatchId}`;
                    const stats = await runMatchAggregateQueries(connection, condition);
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
    
    return { leagueStats, playerStats, matchStats };
}

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
}

const getLastTableUpdateTimes = async (connection, database) => {
    const result = await execQuery(connection, lastTableUpdateTimesQuery(database));
    return result.results.reduce((acc, row) => {
        acc[row.tableName] = row.updateTime ? row.updateTime.getTime() : Date.now();
        return acc;
    }, {});
}

const generateData = async (increment, matchIds, dataDir) => {
    const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    });
    connection.connect();
    
    await Promise.map([
        path.join(dataDir, 'league/'),
        path.join(dataDir, 'matches/'),
        path.join(dataDir, 'players/')
    ], async (dir) => fs.ensureDir(dir));

    console.log('Inserting unknown players...');
    await execQuery(connection, insertUnknownPlayersQuery);

    const wlMatrix = {
        with: await runWlMatrixQuery(connection, wlMatrixQueries.with),
        against: await runWlMatrixQuery(connection, wlMatrixQueries.against),
    };
    console.log('Writing wlMatrix.json...');
    await fs.writeJson(path.join(dataDir, 'wlMatrix.json'), wlMatrix);

    const matches = await runMatchesQuery(connection, matchesQuery);
    console.log('Writing matches.json...');
    await fs.writeJson(path.join(dataDir, 'matches.json'), matches);

    const players = await runPlayersQuery(connection, playerQuery);
    console.log('Writing players.json...');
    await fs.writeJson(path.join(dataDir, 'players.json'), players);

    const mapWL = await runMapWLQuery(connection, mapWLQuery);
    const playerMapWL = processPlayerMapWL(players, mapWL);
    console.log('Writing playerMapWL.json...');
    await fs.writeJson(path.join(dataDir, 'playerMapWL.json'), playerMapWL);

    const damageMatrix = {};
    for (const pvpType of pvpTypes) {
        damageMatrix[pvpType] = await runDamageMatrixQuery(connection, pvpQueries.league(pvpType));
    }
    console.log('Writing damageMatrix.json...');
    await fs.writeJson(path.join(dataDir, 'damageMatrix.json'), damageMatrix);

    const { leagueStats, playerStats, matchStats } = await processRounds(connection, increment, matchIds);

    console.log('Writing league/<match_id>.json...', Object.entries(leagueStats).length);
    await Promise.map(Object.entries(leagueStats), async ([matchId, data]) => fs.writeJson(path.join(dataDir, `league/${matchId}.json`), data));

    console.log('Writing league.json...');
    const latestLeagueMatchId = matches.data[0][0];
    await fs.copy(path.join(dataDir, `league/${latestLeagueMatchId}.json`), path.join(dataDir, `league.json`));

    console.log('Writing players/<steamid>.json...', Object.entries(playerStats).length);
    await Promise.map(Object.entries(playerStats), async ([steamid, data]) => {
        const filepath = path.join(dataDir, `players/${steamid}.json`);
        if (increment && await fs.pathExists(filepath)) {
            const currData = await fs.readJson(filepath);
            const newData = mergePlayerStats(currData, data);
            return fs.writeJson(filepath, newData);
        }
        else {
            return fs.writeJson(filepath, data);
        }
    });
    
    console.log('Writing matches/<match_id>.json...', Object.entries(matchStats).length);
    await Promise.map(Object.entries(matchStats), async ([matchId, data]) => fs.writeJson(path.join(dataDir, `matches/${matchId}.json`), data));

    const tableTimestamps = await getLastTableUpdateTimes(connection, process.env.DB_NAME);
    const timestamps = {
        league: Math.max(tableTimestamps.survivor, tableTimestamps.infected, tableTimestamps.players),
        wlMatrix: Math.max(tableTimestamps.matchlog, tableTimestamps.players),
        damageMatrix: Math.max(tableTimestamps.pvp_ff, tableTimestamps.pvp_infdmg, tableTimestamps.players),
        matches: Math.max(tableTimestamps.matchlog, tableTimestamps.players),
        players: tableTimestamps.players,
        playerMapWL: Math.max(tableTimestamps.matchlog, tableTimestamps.maps, tableTimestamps.players),
    }
    
    console.log('Writing timestamp.json...');
    await fs.writeJson(path.join(dataDir, `timestamps.json`), timestamps);

    connection.end();
}

const spawnP = async (cmd, args=[]) => {
    return new Promise((resolve, reject) => {
        const ls = spawn(cmd, args);
        ls.stdout.on('data', (data) => {
            console.log(`${data}`);
        });

        ls.stderr.on('data', (data) => {
            console.log(`${data}`);
        });

        ls.on('close', (code) => {
            resolve(code);
        });
    });
}

const main = async (init=false, initDatabaseOpt=false, seed=false, buildOpt=false, watchOpt=false, buildCssOpt=false, buildJsOpt=false, increment=false, production=false, matchIds=[], publicDir='public/', dataDir='public/data/', generateDataOpt=false, renderTemplateOpt=false) => {
    console.log(`Options:
    Initialize: ${init}
    Initialize database: ${initDatabaseOpt}
    Seed database: ${seed}
    Build: ${buildOpt}
    Watch: ${watchOpt}
    Build css: ${buildCssOpt}
    Build js: ${buildJsOpt}
    Incremental update: ${!!increment}
    Production: ${!!production}
    Match IDs: ${JSON.stringify(matchIds)}
    Public dir: ${publicDir}
    Data dir: ${dataDir}
    Generate data: ${generateDataOpt}
    Render template: ${renderTemplateOpt}
    Database: ${process.env.DB_NAME}`);

    await fs.ensureDir(publicDir);
    await fs.ensureDir(dataDir);
    
    if (init) {
        console.log(`Initializing ${publicDir}...`);
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
    
    if (renderTemplateOpt || watchOpt) {
        console.log('Rendering template...');
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
        console.log('Watch for css file changes...');
        const cssWatcher = chokidar.watch(path.join(__dirname, 'src/css'), {
            persistent: true,
            awaitWriteFinish: true
        });
        cssWatcher.on('change', async (path) => {
            console.log(`Css file ${path} has been changed.`);
            await buildCss(publicDir);
        });
        console.log('Watch for template file changes...');
        const templateWatcher = chokidar.watch(path.join(__dirname, 'src/templates'), {
            persistent: true,
            awaitWriteFinish: true
        });
        templateWatcher.on('change', async (path) => {
            console.log(`Template file ${path} has been changed.`);
            await renderTemplate(false, publicDir, dataDir);
        });
    }
    
    console.log('Done.');
};

process.on('unhandledRejection', error => {
    console.log('unhandledRejection', error.message);
    process.exit(1);
});

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
    .option('-t, --template', 'Render template')

program.parse(process.argv);
main(program.init, program.initDatabase, program.seed, program.build, program.watch, program.buildCss, program.buildJs, program.increment, program.production, program.args.map(matchId => parseInt(matchId)), program.publicDir || process.env.PUBLIC_DIR, program.dataDir || process.env.DATA_DIR, program.data, program.template);
//main(true, []); // no updates to data folder
//main(true, [matchId1, matchId2, ...]); // incremental update of data folder
//main(false, []); // full update of data folder