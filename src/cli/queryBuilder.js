const columnAggregation = require('../data/aggregation.json');

const sideToPrefix = side => (side == 'survivor' ? 'ply' : 'inf');

const queryBuilder = (tableName, cols, aggregation, groupings, minMatchId = -1, maxMatchId = 4294967295) => {
    const columnSelect = [];
    const groupBy = [];
    let playerJoin = '';
    let tableJoin = '';
    const orderBy = [];
    switch (aggregation) {
    case 'total':
        columnSelect.push(`COUNT(*) as ${sideToPrefix(tableName)}TotalRounds`);
        cols.reduce((acc, col) => {
            acc.push(columnAggregation[col] || `SUM(a.${col}) as ${col}`);
            return acc;
        }, columnSelect);
        break;
    case 'avg':
        columnSelect.push(`COUNT(*) as ${sideToPrefix(tableName)}TotalRounds`);
        cols.reduce((acc, col) => {
            acc.push(columnAggregation[col] || `AVG(a.${col}) as ${col}`);
            return acc;
        }, columnSelect);
        break;
    case 'stddev':
        columnSelect.push(`COUNT(*) as ${sideToPrefix(tableName)}TotalRounds`);
        cols.reduce((acc, col) => {
            acc.push(`STDDEV(a.${col}) as ${col}`);
            return acc;
        }, columnSelect);
        return `SELECT ${columnSelect.join(',')}
            FROM (${queryBuilder(tableName, cols, 'avg', ['player'], minMatchId, maxMatchId)}) a`;
        break;
    case 'teamPct':
        columnSelect.push(`COUNT(*) as ${sideToPrefix(tableName)}TotalRounds`);
        cols.reduce((acc, col) => {
            if (columnAggregation[col]) {
                acc.push(columnAggregation[col].replace(/COALESCE\(SUM\(a.(.*?)\) \/ NULLIF\(SUM\(a.(.*?)\), 0\), 0\)/, `COALESCE(SUM(a.${col} * a.$2) / NULLIF(SUM(b.${col} * b.$2), 0), 0)`));
            }
            else {
                acc.push(`SUM(a.${col}) / SUM(b.${col}) as ${col}`);
            }
            return acc;
        }, columnSelect);
        tableJoin = `JOIN (${queryBuilder(tableName, cols, 'total', ['match', 'round', 'team'], minMatchId, maxMatchId)}) b ON a.matchId = b.matchId AND a.round = b.round AND a.isSecondHalf = b.isSecondHalf`;
        break;
    default:
        columnSelect.push('a.round as round');
        cols.reduce((acc, col) => {
            acc.push(`a.${col} as ${col}`);
            return acc;
        }, columnSelect);
        break;
    }
    for (const grouping of groupings) {
        switch (grouping) {
        case 'match':
            columnSelect.push('a.matchId as matchId');
            if (aggregation) groupBy.push('a.matchId');
            orderBy.push('a.matchId');
            break;
        case 'round':
            columnSelect.push('a.round as round');
            if (aggregation) groupBy.push('a.round');
            orderBy.push('a.round');
            break;
        case 'team':
            columnSelect.push('a.isSecondHalf as isSecondHalf');
            if (aggregation) groupBy.push('a.isSecondHalf');
            orderBy.push('a.isSecondHalf');
            break;
        case 'player':
            columnSelect.push('p.name as name');
            playerJoin = 'JOIN players p ON a.steamid = p.steamid';
            if (aggregation) {
                columnSelect.push('MAX(p.steamid) as steamid');
                groupBy.push('p.name');
            }
            else {
                columnSelect.push('p.steamid as steamid');
            }
            orderBy.push('p.name');
            break;
        }
    }

    return `SELECT ${columnSelect.join(',')}
FROM ${tableName} a
${playerJoin}
${tableJoin}
WHERE a.deleted = 0 AND a.matchId >= ${minMatchId} AND a.matchId <= ${maxMatchId}
${groupBy.length ? `GROUP BY ${groupBy.join(',')}` : ''}
${orderBy.length ? `ORDER BY ${orderBy.join(',')}` : ''}`;
};

/*
const columns = require('../data/columns.json');
const cols = {
    survivor: columns.survivor.map(row => row.data).filter(header => header.startsWith('ply') && header != 'plyTotalRounds'),
    infected: columns.infected.map(row => row.data).filter(header => header.startsWith('inf') && header != 'infTotalRounds'),
};
for (const groupings of [[], ['player']]) {
    for (const aggregation of ['', 'total', 'avg', 'stddev', 'teamPct']) {
        if (groupings.length && !aggregation) continue;
        console.log(queryBuilder('survivor', cols.survivor, -1, 4294967295, aggregation, groupings) + ';');
        console.log('');
        console.log(queryBuilder('infected', cols.infected, -1, 4294967295, aggregation, groupings) + ';');
        console.log('');
    }
} */

module.exports = queryBuilder;
