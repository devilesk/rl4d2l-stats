const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const pug = require('pug');
const categories = require("../data/categories.json");
const columns = require("../data/columns.json");
const homepage = require("../data/homepage.json");

const formatDate = d => `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

module.exports = async (production, publicDir, dataDir) => {
    const templatePath = path.join(__dirname, '../templates/index.pug');
    const compiledFunction = pug.compileFile(templatePath, { pretty: true });
    
    const [matches, players, timestamps] = await Promise.map([
        path.join(dataDir, 'matches.json'),
        path.join(dataDir, 'players.json'),
        path.join(dataDir, 'timestamps.json'),
    ], async (f) => fs.pathExists(f).then((exists) => {
        if (exists) {
            return fs.readJson(f);
        }
        else {
            return {};
        }
    }));
    
    const matchesData = matches.data || [];
    
    const matchOptions = matchesData.reduce(function (acc, row) {
        if (acc.indexOf(row[0]) == -1) acc.push(row[0]);
        return acc;
    }, []).sort().reverse().map(function (matchId) {
        var d = new Date(matchId * 1000);
        return { value: matchId, text: `${matchId} - ${formatDate(d)}` };
    });
    
    const mapOptions = matchesData.reduce(function (acc, row) {
        if (acc.indexOf(row[1]) == -1) acc.push(row[1]);
        return acc;
    }, ['']).sort().map(function (map) {
        return { value: map, text: map || '------ any ------' };
    });
    
    const mapsTable = Object.entries(matchesData.reduce(function (acc, row) {
        if (!acc[row[1]] || row[0] > acc[row[1]]) acc[row[1]] = row[0];
        return acc;
    }, {})).sort(function (a, b) { return a[1] > b[1] ? -1 : 1 }).map(function (row) {
        var d = new Date(row[1] * 1000);
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
            console.log('Missing rev-manifest.json');
        }
        cssName = revManifest['index.min.css'] || 'index.min.css';
        scriptName = revManifest['bundle.min.js'] || 'bundle.min.js';
    }
    console.log('Css filename', cssName);
    console.log('Js filename', scriptName);
    console.log('Rendering index.html...');
    const indexPath = path.join(publicDir, 'index.html');
    await fs.writeFile(indexPath, compiledFunction({ production, cssName, scriptName, timestamps, columns, homepage, mapsTable, matches, players, categories, matchOptions, mapOptions }));
    console.log('Done rendering.');
}