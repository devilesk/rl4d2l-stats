const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const pug = require('pug');
const logger = require('./logger');
const categories = require('../data/categories.json');
const columns = require('../data/columns.json');
const homepage = require('../data/homepage.json');
const formatDate = require('../common/formatDate');

module.exports = async (production, publicDir, dataDir) => {
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
    await fs.writeFile(indexPath, compiledFunction({ production, cssName, scriptName, timestamps, columns, homepage, mapsTable, matches, players, categories, matchOptions, mapOptions }));
    logger.info('Done rendering.');
};
