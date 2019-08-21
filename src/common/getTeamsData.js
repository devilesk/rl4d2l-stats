const playerCombinations = require('./playerCombinations');

const getTeamsData = (steamIds, playerNames, latestLeagueMatchData) => {
    const combs = playerCombinations(steamIds);
    const rankings = {};
    const teams = [];
    for (const steamId of steamIds) {
        const row = latestLeagueMatchData.rankings.find(row => row.steamid === steamId);
        rankings[steamId] = row ? row.combined || 0 : 0;
    }
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
            row = row.concat(comb.slice(0, 4));
            row = row.concat(comb.slice(4));
            row = row.map(p => playerNames[p]);
            row.splice(4, 0, +(t1).toFixed(3));
            row.splice(5, 0, +(t1 - t2).toFixed(3));
            row.splice(6, 0, +(t2).toFixed(3));
        }
        else {
            row = row.concat(comb.slice(4));
            row = row.concat(comb.slice(0, 4));
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
