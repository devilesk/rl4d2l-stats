const { getAvg, getStdDev, getZScore, zScoreToPercentile } = require('./util');

const sides = ['survivor', 'infected'];

module.exports = (matchStats, columns) => {
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