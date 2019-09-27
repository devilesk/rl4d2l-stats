const mysql = require('mysql');
const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const pug = require('pug');
const logger = require('./logger');
const categories = require('../data/categories.json');
const columns = require('../data/columns.json');
const homepage = require('../data/homepage.json');
const formatDate = require('../common/formatDate');
const execQuery = require('../common/execQuery');

const draftsQuery = `SELECT a.season as season, a.draftOrder as draftOrder, a.steamid_0 as captainid, b.name as captain, a.steamid_1 as pickid, c.name as pick, 1 as round
FROM team a
JOIN players b ON a.steamid_0 = b.steamid
JOIN players c ON a.steamid_1 = c.steamid
WHERE a.deleted = 0
UNION
SELECT a.season as season, a.draftOrder as draftOrder, a.steamid_0 as captainid, b.name as captain, a.steamid_2 as pickid, c.name as pick, 2 as round
FROM team a
JOIN players b ON a.steamid_0 = b.steamid
JOIN players c ON a.steamid_2 = c.steamid
WHERE a.deleted = 0
UNION
SELECT a.season as season, a.draftOrder as draftOrder, a.steamid_0 as captainid, b.name as captain, a.steamid_3 as pickid, c.name as pick, 3 as round
FROM team a
JOIN players b ON a.steamid_0 = b.steamid
JOIN players c ON a.steamid_3 = c.steamid
WHERE a.deleted = 0
ORDER BY season, round, draftOrder DESC;`;

const teamsQuery = `SELECT a.season, a.seed, a.draftOrder, a.wins, a.losses, a.name, a.steamid_0, a.steamid_1, a.steamid_2, a.steamid_3, b.name as name1, c.name as name2, d.name as name3, e.name as name4,
CASE
    WHEN logoImage = '' OR logoImage IS NULL THEN '/img/cowtank.jpg'
    ELSE logoImage
END as logoImage
FROM team a
JOIN players b ON a.steamid_0 = b.steamid
JOIN players c ON a.steamid_1 = c.steamid
JOIN players d ON a.steamid_2 = d.steamid
JOIN players e ON a.steamid_3 = e.steamid
WHERE a.deleted = 0
ORDER BY a.season, a.seed, a.name DESC;`;

const leagueMatchesQuery = `SELECT a.season, a.playoffs, a.round, a.map, a.matchId, a.winner, a.loser, b.name as winnerName, c.name as loserName, a.resultCode, d.name as winnerTeam, e.name as loserTeam, f.campaign
FROM leaguematchlog a
LEFT JOIN players b ON a.winner = b.steamid
LEFT JOIN players c ON a.loser = c.steamid
LEFT JOIN team d ON a.winner = d.steamid_0 AND a.season = d.season
LEFT JOIN team e ON a.loser = e.steamid_0 AND a.season = e.season
JOIN maps f ON a.map = f.map
WHERE a.deleted = 0
ORDER BY a.season, a.playoffs, a.round, a.resultCode;`;

module.exports = async (production, publicDir, dataDir) => {
    const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    });
    connection.connect();
    
    const seasons = (await execQuery(connection, 'SELECT season FROM season ORDER BY season DESC')).results;
    seasonOptions = seasons.reduce((acc, row) => {
        acc.push({ value: row.season, text: 'Season ' + row.season });
        return acc;
    }, []);
    
    const drafts = (await execQuery(connection, draftsQuery)).results.reduce((acc, row) => {
        acc[row.season - 1] = acc[row.season - 1] || [];
        acc[row.season - 1].push(row);
        return acc;
    }, []);
    
    const teams = (await execQuery(connection, teamsQuery)).results;
    
    const leagueMatchesQueryResult = (await execQuery(connection, leagueMatchesQuery)).results;
    const seasonMatchHistory = [];
    const teamMatches = [];
    for (const row of leagueMatchesQueryResult) {
        if (row.playoffs) continue;
        seasonMatchHistory[row.season - 1] = seasonMatchHistory[row.season - 1] || [];
        seasonMatchHistory[row.season - 1][row.round - 1] = seasonMatchHistory[row.season - 1][row.round - 1] || { map: '', matches: [] };
        seasonMatchHistory[row.season - 1][row.round - 1].map = row.campaign;
        seasonMatchHistory[row.season - 1][row.round - 1].matches.push({
            matchId: row.matchId,
            winnerTeam: row.winnerTeam,
            winnerName: row.winnerName,
            loserTeam: row.loserTeam,
            loserName: row.loserName,
            map: row.campaign,
            resultCode: row.resultCode,
        });
    }
    for (const row of leagueMatchesQueryResult) {
        if (row.playoffs) continue;
        teamMatches[row.season - 1] = teamMatches[row.season - 1] || {};
        teamMatches[row.season - 1][row.winner] = teamMatches[row.season - 1][row.winner] || [];
        teamMatches[row.season - 1][row.winner][row.round - 1] = {
            matchId: row.matchId,
            oppTeam: row.loserTeam,
            oppCaptain: row.loserName,
            map: row.campaign,
        };
        switch (row.resultCode) {
            case 0:
                teamMatches[row.season - 1][row.winner][row.round - 1].result = 'W';
            break;
            case 1: 
                teamMatches[row.season - 1][row.winner][row.round - 1].result = 'FF';
            break;
            case 2: 
                teamMatches[row.season - 1][row.winner][row.round - 1].result = 'BYE';
            break;
            case 3: 
                teamMatches[row.season - 1][row.winner][row.round - 1].result = 'TBD';
            break;
        }
        if (!row.loser) continue;
        teamMatches[row.season - 1][row.loser] = teamMatches[row.season - 1][row.loser] || [];
        teamMatches[row.season - 1][row.loser][row.round - 1] = {
            matchId: row.matchId,
            oppTeam: row.winnerTeam,
            oppCaptain: row.winnerName,
            map: row.campaign,
        };
        switch (row.resultCode) {
            case 0:
                teamMatches[row.season - 1][row.loser][row.round - 1].result = 'L';
            break;
            case 1: 
                teamMatches[row.season - 1][row.loser][row.round - 1].result = 'FF';
            break;
            case 2: 
                teamMatches[row.season - 1][row.loser][row.round - 1].result = 'BYE';
            break;
            case 3: 
                teamMatches[row.season - 1][row.loser][row.round - 1].result = 'TBD';
            break;
        }
    }

    connection.end();
    
    const templatePath = path.join(__dirname, '../templates/index.pug');
    const compiledFunction = pug.compileFile(templatePath, { pretty: true });

    const [matches, players, timestamps] = await Promise.map([
        path.join(dataDir, 'matches.json'),
        path.join(dataDir, 'players.json'),
        path.join(dataDir, 'timestamps.json'),
    ], async f => fs.pathExists(f).then((exists) => {
        if (exists) {
            return fs.readJson(f);
        }

        return {};
    }));

    const matchesData = matches.data || [];

    const matchOptions = matchesData.reduce((acc, row) => {
        if (acc.indexOf(row[0]) == -1) acc.push(row);
        return acc;
    }, []).sort((a, b) => b[0] - a[0]).map((row) => {
        const matchId = row[0];
        const map = row[1];
        const d = new Date(matchId * 1000);
        return { value: matchId, text: `${matchId} - ${formatDate(d)} - ${map}` };
    });

    const mapOptions = matchesData.reduce((acc, row) => {
        if (acc.indexOf(row[1]) == -1) acc.push(row[1]);
        return acc;
    }, ['']).sort().map(map => ({ value: map, text: map || '------ any ------' }));

    const mapsTable = Object.entries(matchesData.reduce((acc, row) => {
        if (!acc[row[1]] || row[0] > acc[row[1]]) acc[row[1]] = row[0];
        return acc;
    }, {})).sort((a, b) => (a[1] > b[1] ? -1 : 1)).map((row) => {
        const d = new Date(row[1] * 1000);
        row.push(row[1]);
        row[1] = formatDate(d);
        return row;
    });

    let cssName = 'index.min.css';
    let scriptName = 'bundle.min.js';
    if (production) {
        let revManifest = {};
        if (fs.existsSync('rev-manifest.json')) {
            revManifest = await fs.readJson('rev-manifest.json');
        }
        else {
            logger.info('Missing rev-manifest.json');
        }
        cssName = revManifest['index.min.css'] || 'index.min.css';
        scriptName = revManifest['bundle.min.js'] || 'bundle.min.js';
    }
    logger.info('Css filename', cssName);
    logger.info('Js filename', scriptName);
    logger.info('Rendering index.html...');
    const indexPath = path.join(publicDir, 'index.html');
    await fs.writeFile(indexPath, compiledFunction({ production, cssName, scriptName, timestamps, columns, homepage, mapsTable, matches, players, categories, matchOptions, mapOptions, seasonOptions, drafts, teams, teamMatches, seasonMatchHistory }));
    logger.info('Done rendering.');
};
