SELECT MAX(c.campaign) as campaign, MAX(c.round) as round, a.map as map, COUNT(a.map) as mapcount, AVG(a.points) as avgpoints, AVG(a.survivors) as avgsurvivors
FROM (
SELECT a.matchId as matchId, a.map as map, a.teamATotal as points, a.survivorCount as survivors
FROM round a
WHERE a.teamIsA = 1 AND a.isSecondHalf = 0 AND a.round = 1 AND a.deleted = 0
UNION ALL
SELECT a.matchId as matchId, a.map as map, a.teamATotal as points, a.survivorCount as survivors
FROM round a
WHERE a.teamIsA = 1 AND a.isSecondHalf = 1 AND a.round = 1 AND a.deleted = 0
UNION ALL
SELECT a.matchId as matchId, a.map as map, a.teamBTotal as points, a.survivorCount as survivors
FROM round a
WHERE a.teamIsA = 0 AND a.isSecondHalf = 0 AND a.round = 1 AND a.deleted = 0
UNION ALL
SELECT a.matchId as matchId, a.map as map, a.teamBTotal as points, a.survivorCount as survivors
FROM round a
WHERE a.teamIsA = 0 AND a.isSecondHalf = 1 AND a.round = 1 AND a.deleted = 0
UNION ALL
SELECT a.matchId as matchId, a.map as map, a.teamARound as points, a.survivorCount as survivors
FROM round a
WHERE a.teamIsA = 1 AND a.isSecondHalf = 0 AND a.round > 1 AND a.deleted = 0
UNION ALL
SELECT a.matchId as matchId, a.map as map, a.teamARound as points, a.survivorCount as survivors
FROM round a
WHERE a.teamIsA = 1 AND a.isSecondHalf = 1 AND a.round > 1 AND a.deleted = 0
UNION ALL
SELECT a.matchId as matchId, a.map as map, a.teamBRound as points, a.survivorCount as survivors
FROM round a
WHERE a.teamIsA = 0 AND a.isSecondHalf = 0 AND a.round > 1 AND a.deleted = 0
UNION ALL
SELECT a.matchId as matchId, a.map as map, a.teamBRound as points, a.survivorCount as survivors
FROM round a
WHERE a.teamIsA = 0 AND a.isSecondHalf = 1 AND a.round > 1 AND a.deleted = 0
) a
JOIN (SELECT DISTINCT matchId FROM matchlog WHERE deleted = 0) b
ON a.matchId = b.matchId
JOIN maps c
ON a.map = c.map
GROUP BY a.map
ORDER BY MAX(c.campaign), MAX(c.round);