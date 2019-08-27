const reduceStatsToRankings = (steamIds, latestLeagueMatchData) => {
    const rankings = {};
    for (const steamId of steamIds) {
        const row = latestLeagueMatchData.rankings.find(row => row.steamid === steamId);
        rankings[steamId] = row ? row.combined || 0 : 0;
    }
    return rankings;
}

module.exports = reduceStatsToRankings;