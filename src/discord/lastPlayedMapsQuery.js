const lastPlayedMapsQuery = campaigns => `SELECT b.campaign as campaign, MAX(a.startedAt) as startedAt
FROM matchlog a
JOIN maps b
ON a.map = b.map
WHERE b.campaign NOT IN (${campaigns.map(campaign => "'" + campaign + "'").join(',')})
GROUP BY b.campaign
ORDER BY MAX(a.startedAt) DESC;`;

module.exports = lastPlayedMapsQuery;