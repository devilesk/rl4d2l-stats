const trueskill = require('ts-trueskill');
const { getAvg, getStdDev, getZScore, zScoreToPercentile } = require('../common/util');

const processTrueskill = (matches, leagueStats, increment, matchIds, seasons) => {
    const getSeason = matchId => seasons.find(season => season.startedAt <= matchId && season.endedAt >= matchId);
    const k = 3;
    let ratings = {};
    let season;
    let currentSeason = 0;
    for (const match of matches.data) {
        const matchId = match[0];
        if (seasons.length) {
            season = getSeason(matchId);
            if (season && season.season !== currentSeason) {
                ratings = {};
                currentSeason = season.season;
            }
        }
        const playersA = match[2].split(',').map(player => player.trim());
        const playersB = match[4].split(',').map(player => player.trim());
        for (const player of playersA.concat(playersB)) {
            ratings[player] = ratings[player] || new trueskill.Rating();
        }
        const winningTeam = match[3];
        const winner = winningTeam === '>' ? playersA : playersB;
        const loser = winningTeam === '>' ? playersB : playersA;
        const [ratedWinner, ratedLoser] = trueskill.rate([winner.map(player => ratings[player]), loser.map(player => ratings[player])]);
        for (let i = 0; i < 4; i++) {
            ratings[winner[i]] = ratedWinner[i];
            ratings[loser[i]] = ratedLoser[i];
        }
        
        if (increment && matchIds.indexOf(matchId) == -1) continue;

        const rows = leagueStats[matchId].rankings;
        const csr = Object.values(ratings).map(rating => rating.mu - k * rating.sigma);
        let avg = getAvg(csr);
        let stddev = getStdDev(csr);
        for (const row of rows) {
            const rating = ratings[row.name];
            if (rating) {
                row.mu = rating.mu;
                row.sigma = rating.sigma;
                row.csr = rating.mu - k * rating.sigma;
                const zScore = getZScore(row.csr, avg, stddev);
                row.csrCdf = zScoreToPercentile(zScore);
            }
            
            row.combined = row.total * 0.6 + row.csr * 0.4;
        }
        
        const combined = rows.map(row => row.combined || 0);
        avg = getAvg(combined);
        stddev = getStdDev(combined);
        for (const row of rows) {
            const zScore = getZScore(row.combined, avg, stddev);
            row.combinedCdf = zScoreToPercentile(zScore);
        }
        
        // format numbers
        for (const row of rows) {
            for (const ratingType of ['mu', 'sigma', 'csr', 'csrCdf', 'combined', 'combinedCdf']) {
                row[ratingType] = row[ratingType] == null ? null : +row[ratingType].toFixed(2);
            }
        }
    }
}

module.exports = processTrueskill;