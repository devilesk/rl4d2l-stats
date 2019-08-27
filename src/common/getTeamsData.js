const playerCombinations = require('./playerCombinations');
const reduceStatsToRankings = require('./reduceStatsToRankings');

const getTeamsData = (steamIds, playerNames, latestLeagueMatchData) => {
    const combs = playerCombinations(steamIds);
    const rankings = reduceStatsToRankings(steamIds, latestLeagueMatchData);
    const teams = [];
    for (const comb of combs) {
        let t1 = 0;
        let t2 = 0;
        for (let i = 0; i < 4; i++) {
            t1 += rankings[comb[i]];
        }
        for (let i = 4; i < 8; i++) {
            t2 += rankings[comb[i]];
        }
        let row = [];
        if (t1 > t2) {
            row = row.concat(comb.slice(0, 4).sort((a, b) => rankings[b] - rankings[a]));
            row = row.concat(comb.slice(4).sort((a, b) => rankings[b] - rankings[a]));
            row = row.map(p => playerNames[p]);
            row.splice(4, 0, +(t1).toFixed(3));
            row.splice(5, 0, +(t1 - t2).toFixed(3));
            row.splice(6, 0, +(t2).toFixed(3));
        }
        else {
            row = row.concat(comb.slice(4).sort((a, b) => rankings[b] - rankings[a]));
            row = row.concat(comb.slice(0, 4).sort((a, b) => rankings[b] - rankings[a]));
            row = row.map(p => playerNames[p]);
            row.splice(4, 0, +(t2).toFixed(3));
            row.splice(5, 0, +(t2 - t1).toFixed(3));
            row.splice(6, 0, +(t1).toFixed(3));
        }
        teams.push(row);
    }
    return teams;
};

module.exports = getTeamsData;
