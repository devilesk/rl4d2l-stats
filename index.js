require('dotenv').config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' });
const mysql = require('mysql');
const pug = require('pug');
const distributions = require('distributions');
const fs = require('fs');
const path = require('path');
const survivorHeaderData = require("./data/survivor.json");
const infectedHeaderData = require("./data/infected.json");
const maps = require("./data/maps.json");
const categories = require("./data/categories.json");
const columns = require("./data/columns.json");
const revManifest = require("./rev-manifest.json");
const program = require('commander');
const pjson = require('./package.json');

const formatDate = d => `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

const cols = {
    survivor: Object.keys(survivorHeaderData).filter(header => survivorHeaderData[header] != null && header != 'steamid' && header != 'plyTotalRounds'),
    infected: Object.keys(infectedHeaderData).filter(header => infectedHeaderData[header] != null && header != 'steamid' && header != 'infTotalRounds'),
};

const sideToPrefix = side => side == 'survivor' ? 'ply' : 'inf';

const sides = ['survivor', 'infected'];

const normal = distributions.Normal(0, 1);

const getAvg = (arr) => {
    const total = arr.reduce((acc, val) => (acc += val), 0);
    return total / arr.length;
};

const getStdDev = (arr) => {
    const avg = getAvg(arr);
    const sumOfSquares = arr.reduce((acc, val) => (acc += ((val - avg) * (val - avg))), 0);
    return Math.sqrt(sumOfSquares / arr.length);
};

const getZScore = (val, avg, stddev) => ((val - avg) / stddev);

const zScoreToPercentile = zScore => (normal.cdf(zScore) * 100);

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

const processRankings = (matchStats) => {
    // calculate survivor and infected sum of weighted z-scores for each player
    const playerRatings = {};
    for (const side of sides) {
        for (row of matchStats[side].indNorm) {
            playerRatings[row.steamid] = playerRatings[row.steamid] || { name: row.name, steamid: row.steamid };
            playerRatings[row.steamid][side] = columns[side].reduce(function (acc, col) {
                if (col.weight != null && !isNaN(row[col.data])) {
                    acc += row[col.data] * col.weight;
                }
                return acc;
            }, 0);
        }
    }
    
    // calculate survivor and infected rating percentiles
    const rows = Object.values(playerRatings);
    for (const side of sides) {
        const ratings = rows.map(row => row[side] || 0);
        const avg = getAvg(ratings);
        const stddev = getStdDev(ratings);
        for (const row of rows) {
            if (row[side] != null) {
                const zScore = getZScore(row[side], avg, stddev);
                row[side+'Cdf'] = zScoreToPercentile(zScore);
            }
            else {
                row[side] = null;
                row[side+'Cdf'] = null;
            }
        }
    }
    
    // calculate combined rating
    for (const row of rows) {
        row.total = (row.survivor || 0) + (row.infected || 0);
    }
    
    // calculated combined percentile
    const ratings = rows.map(row => row.total || 0);
    const avg = getAvg(ratings);
    const stddev = getStdDev(ratings);
    for (const row of rows) {
        const zScore = getZScore(row.total, avg, stddev);
        row.totalCdf = zScoreToPercentile(zScore);
    }
    
    // format numbers
    for (const row of rows) {
        for (const ratingType of ['total', 'survivor', 'infected', 'totalCdf', 'survivorCdf', 'infectedCdf']) {
            row[ratingType] = row[ratingType] == null ? null : +row[ratingType].toFixed(2);
        }
    }

    return rows;
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
        leagueStats[matchId].rankings = processRankings(leagueStats[matchId]);
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
                        if (playerMatches[row.steamid][matchId]) {
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

const renderTemplate = (production, dataDir) => {
    const compiledFunction = pug.compileFile('src/templates/index.pug', { pretty: true });
    
    const matches = JSON.parse(fs.readFileSync(path.join(dataDir, 'matches.json')));
    const players = JSON.parse(fs.readFileSync(path.join(dataDir, 'players.json')));
    const timestamps = JSON.parse(fs.readFileSync(path.join(dataDir, 'timestamps.json')));
    
    const matchOptions = matches.data.reduce(function (acc, row) {
        if (acc.indexOf(row[0]) == -1) acc.push(row[0]);
        return acc;
    }, []).sort().reverse().map(function (matchId) {
        var d = new Date(matchId * 1000);
        return { value: matchId, text: `${matchId} - ${formatDate(d)}` };
    });
    
    const mapOptions = matches.data.reduce(function (acc, row) {
        if (acc.indexOf(row[1]) == -1) acc.push(row[1]);
        return acc;
    }, ['']).sort().map(function (map) {
        return { value: map, text: map || '------ any ------' };
    });
    
    const mapsTable = Object.entries(matches.data.reduce(function (acc, row) {
        if (!acc[row[1]] || row[0] > acc[row[1]]) acc[row[1]] = row[0];
        return acc;
    }, {})).sort(function (a, b) { return a[1] > b[1] ? -1 : 1 }).map(function (row) {
        var d = new Date(row[1] * 1000);
        row[1] = formatDate(d);
        return row;
    });
    
    const cssName = production ? revManifest['index.min.css'] : 'index.min.css';
    console.log('Css name', cssName);
    const scriptName = production ? revManifest['bundle.min.js'] : 'bundle.min.js';
    console.log('Script name', scriptName);
    console.log('Rendering index.html...');
    fs.writeFileSync('public/index.html', compiledFunction({ cssName, scriptName, timestamps, columns, mapsTable, matches, players, categories, matchOptions, mapOptions }));
}

const generateData = async (increment, matchIds, dataDir) => {
    const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    });
    connection.connect();

    console.log('Inserting unknown players...');
    await execQuery(connection, insertUnknownPlayersQuery);

    const wlMatrix = {
        with: await runWlMatrixQuery(connection, wlMatrixQueries.with),
        against: await runWlMatrixQuery(connection, wlMatrixQueries.against),
    };
    console.log('Writing wlMatrix.json...');
    fs.writeFileSync(path.join(dataDir, 'wlMatrix.json'), JSON.stringify(wlMatrix));

    const matches = await runMatchesQuery(connection, matchesQuery);
    console.log('Writing matches.json...');
    fs.writeFileSync(path.join(dataDir, 'matches.json'), JSON.stringify(matches));

    const players = await runPlayersQuery(connection, playerQuery);
    console.log('Writing players.json...');
    fs.writeFileSync(path.join(dataDir, 'players.json'), JSON.stringify(players));

    const mapWL = await runMapWLQuery(connection, mapWLQuery);
    const playerMapWL = processPlayerMapWL(players, mapWL);
    console.log('Writing playerMapWL.json...');
    fs.writeFileSync(path.join(dataDir, 'playerMapWL.json'), JSON.stringify(playerMapWL));

    const damageMatrix = {};
    for (const pvpType of pvpTypes) {
        damageMatrix[pvpType] = await runDamageMatrixQuery(connection, pvpQueries.league(pvpType));
    }
    console.log('Writing damageMatrix.json...');
    fs.writeFileSync(path.join(dataDir, 'damageMatrix.json'), JSON.stringify(damageMatrix));

    const { leagueStats, playerStats, matchStats } = await processRounds(connection, increment, matchIds);

    console.log('Writing league/<match_id>.json...', Object.entries(leagueStats).length);
    for (let [matchId, data] of Object.entries(leagueStats)) {
        fs.writeFileSync(path.join(dataDir, `league/${matchId}.json`), JSON.stringify(data));
    }

    console.log('Writing league.json...');
    const latestLeagueMatchId = matches.data[0][0];
    fs.writeFileSync(path.join(dataDir, `league.json`), fs.readFileSync(path.join(dataDir, `league/${latestLeagueMatchId}.json`)));

    console.log('Writing players/<steamid>.json...', Object.entries(playerStats).length);
    for (let [steamid, data] of Object.entries(playerStats)) {
        const filepath = path.join(dataDir, `players/${steamid}.json`);
        if (increment && fs.existsSync(filepath)) {
            const currData = JSON.parse(fs.readFileSync(filepath));
            const newData = mergePlayerStats(currData, data);
            fs.writeFileSync(filepath, JSON.stringify(newData));
        }
        else {
            fs.writeFileSync(filepath, JSON.stringify(data));
        }
    }
    
    console.log('Writing matches/<match_id>.json...', Object.entries(matchStats).length);
    for (let [matchId, data] of Object.entries(matchStats)) {
        fs.writeFileSync(path.join(dataDir, `matches/${matchId}.json`), JSON.stringify(data));
    }

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
    fs.writeFileSync(path.join(dataDir, `timestamps.json`), JSON.stringify(timestamps));

    connection.end();
}

const main = async (increment, production, matchIds, dataDir='public/data/', templateOnly) => {
    console.log(`Incremental update: ${!!increment}\nProduction: ${!!production}\nMatch IDs: ${JSON.stringify(matchIds)}\nData dir: ${dataDir}\nTemplate only: ${templateOnly}\nDatabase: ${process.env.DB_NAME}`);
    
    if (!templateOnly) {
        await generateData(increment, matchIds, dataDir);
    }
    
    renderTemplate(production, dataDir);
    
    console.log('Done.');
};

process.on('unhandledRejection', error => {
    console.log('unhandledRejection', error.message);
    process.exit(1);
});

program
    .version(pjson.version)
    .option('-d, --data-dir <dataDir>', 'Data output directory')
    .option('-p, --production', 'Production mode')
    .option('-i, --increment', 'Incremental data update')
    .option('-t, --template', 'Render template only')
    
program.parse(process.argv);
main(program.increment, program.production, program.args.map(matchId => parseInt(matchId)), program.dataDir || process.env.DATA_DIR, program.template);
//main(true, []); // no updates to data folder
//main(true, [matchId1, matchId2, ...]); // incremental update of data folder
//main(false, []); // full update of data folder