const distributions = require('distributions');

const normal = distributions.Normal(0, 1);

const getAvg = (arr) => {
    const total = arr.reduce((acc, val) => (acc += val), 0);
    return total / arr.length;
};

const getStdDev = (arr) => {
    const avg = getAvg(arr);
    const sumOfSquares = arr.reduce((acc, val) => (acc += ((val - avg) * (val - avg))), 0);
    return Math.sqrt(sumOfSquares / arr.length);
};

const getZScore = (val, avg, stddev) => ((val - avg) / stddev);

const zScoreToPercentile = zScore => (normal.cdf(zScore) * 100);

module.exports = {
    normal,
    getAvg,
    getStdDev,
    getZScore,
    zScoreToPercentile,
};
