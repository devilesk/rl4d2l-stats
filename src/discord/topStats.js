const topQuery = (column, table, sort = 'DESC') => seasonal => `SELECT MAX(b.name) as name, a.steamid as steamid, ${column} as stat
FROM ${table} a
JOIN players b
ON a.steamid = b.steamid
${seasonal ? 'JOIN (SELECT startedAt, endedAt FROM season ORDER BY season DESC LIMIT 1) c' : ''}
WHERE a.deleted = 0
${seasonal ? 'AND a.matchId >= c.startedAt AND a.matchId <= c.endedAt' : ''}
GROUP BY a.steamid
HAVING COUNT(*) > 19
ORDER BY ${column} ${sort}
LIMIT 3;`;

const topStatsFormats = {
    plain: row => `${row.name || row.steamid} | ${row.stat}`,
    percent: row => `${row.name || row.steamid} | ${row.stat.toFixed(2)}%`,
    decimal: row => `${row.name || row.steamid} | ${row.stat.toFixed(2)}`,
};

const topStats = [
    {
        title: 'Rounds',
        table: 'survivor',
        column: 'COUNT(*)',
        format: topStatsFormats.plain,
    },
    {
        title: 'Best Shotgun Accuracy',
        table: 'survivor',
        column: 'SUM(a.plyHitsShotgun) / SUM(a.plyShotsShotgun)',
        format: topStatsFormats.percent,
    },
    {
        title: 'Best SMG Accuracy',
        table: 'survivor',
        column: 'SUM(a.plyHitsSMG) / SUM(a.plyShotsSMG)',
        format: topStatsFormats.percent,
    },
    {
        title: 'Best Pistol Accuracy',
        table: 'survivor',
        column: 'SUM(a.plyHitsPistol) / SUM(a.plyShotsPistol)',
        format: topStatsFormats.percent,
    },
    {
        title: 'Common Kills/Round',
        table: 'survivor',
        column: 'SUM(a.plyCommon) / COUNT(*)',
        format: topStatsFormats.decimal,
    },
    {
        title: 'SI Dmg/Round',
        table: 'survivor',
        column: 'SUM(a.plySIDamage) / COUNT(*)',
        format: topStatsFormats.decimal,
    },
    {
        title: 'Infected Dmg/Round',
        table: 'infected',
        column: 'SUM(a.infDmgUpright) / COUNT(*)',
        format: topStatsFormats.decimal,
    },
    {
        title: 'Tank Dmg/Round',
        table: 'survivor',
        column: 'SUM(a.plyTankDamage) / COUNT(*)',
        format: topStatsFormats.decimal,
    },
    {
        title: 'Best FFs',
        table: 'survivor',
        column: 'SUM(a.plyFFGiven) / COUNT(*)',
        format: topStatsFormats.decimal,
        sort: 'ASC',
    },
    {
        title: 'Worst FFs',
        table: 'survivor',
        column: 'SUM(a.plyFFGiven) / COUNT(*)',
        format: topStatsFormats.decimal,
    },
];

for (const topStat of topStats) {
    topStat.query = topQuery(topStat.column, topStat.table, topStat.sort);
}

module.exports = topStats;
