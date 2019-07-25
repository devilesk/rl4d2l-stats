const path = require('path');
const fs = require('fs');
const { diff } = require("deep-object-diff");

const steamid = 'STEAM_1:1:43423378';
const lhs = JSON.parse(fs.readFileSync(`public/data_full/players/${steamid}.json`));
const rhs = JSON.parse(fs.readFileSync(`public/data_increment/players/${steamid}.json`));

const dir1 = 'data';
const dir2s = ['data_full', 'data_increment', 'data_increment_all', 'data_increment_all_twice'];
const dataDirs = ['players', 'league', 'matches'];
const compareDirs = (dir1, dir2) => {
    console.log(dir1, dir2);
    for (const dataDir of dataDirs) {
        console.log(dataDir);
        const dirpath1 = `public/${dir1}/${dataDir}/`;
        const dirpath2 = `public/${dir2}/${dataDir}/`;
        const files = fs.readdirSync(dirpath1);
        for (const file of files) {
            const filepath1 = path.join(dirpath1, file);
            const filepath2 = path.join(dirpath2, file);
            const lhs = JSON.parse(fs.readFileSync(filepath1));
            const rhs = JSON.parse(fs.readFileSync(filepath2));
            if (!Object.keys(diff(lhs, rhs)).length === 0) {
                console.log(filepath1, filepath2);
            }
        }
    }
}

for (const dir2 of dir2s) {
    compareDirs(dir1, dir2);
}