UPDATE round
SET matchId = 1570316870, round = 5, team = 1, teamIsA = 0, teamARound = 0, teamBRound = 813, teamATotal = 1210, teamBTotal = 2160
WHERE id = 1396;

UPDATE round
SET matchId = 1570316870, round = 5, team = 0, teamIsA = 1, teamARound = 340, teamBRound = 813, teamATotal = 1550, teamBTotal = 2160
WHERE id = 1397;

UPDATE infected
SET matchId = 1570316870, round = 5, team = 1 - team
WHERE matchId = 1570321446;

UPDATE survivor
SET matchId = 1570316870, round = 5, team = 1 - team
WHERE matchId = 1570321446;

UPDATE pvp_ff
SET matchId = 1570316870, round = 5, team = 1 - team
WHERE matchId = 1570321446;

UPDATE pvp_infdmg
SET matchId = 1570316870, round = 5, team = 1 - team
WHERE matchId = 1570321446;

UPDATE matchlog
SET matchId = 1570316870, startedAt = 1570316870, team = 1 - team
WHERE matchId = 1570321446;

UPDATE transaction
SET comment = 'match reward 1570316870'
WHERE comment = 'match reward 1570321446';