import combinations from './combinations';

const playerCombinations = (players) => {
    const teams = combinations(players.slice(0), 4);
    const out = [];
    const res = {};
    for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        const a = teams[i].slice(0).sort();
        const b = [];
        for (let j = 0; j < players.length; j++) {
            const player = players[j];
            if (team.indexOf(player) === -1) {
                b.push(player);
            }
        }
        b.sort();
        if (!res[a.join('')] && !res[b.join('')]) {
            res[a.join('')] = 1;
            res[b.join('')] = 1;
            out.push(a.concat(b));
        }
    }
    return out;
};

export default playerCombinations;
