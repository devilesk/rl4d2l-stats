import playerCombinations from './playerCombinations';

const getTeamsData = (steamIds, playerNames, latestLeagueMatchData) => {
    const combs = playerCombinations(steamIds);
    const rankings = latestLeagueMatchData.rankings.reduce((acc, row) => {
        acc[row.steamid] = row.total;
        return acc;
    }, {});
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

export default getTeamsData;
