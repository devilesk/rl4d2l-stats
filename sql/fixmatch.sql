use lfd2_season_3;

SET @oldMatchId = 1564350136;
SET @newMatchId = 1564355211;
SET @roundStart = 8;
SET @roundEnd = 12;
SET @roundEndTime = 1564359166;
SET @finaleMap = 'c5m5_bridge';

UPDATE round
SET matchId = @newMatchId
WHERE matchId = @oldMatchId
AND round >= @roundStart
AND round <= @roundEnd;

UPDATE infected
SET matchId = @newMatchId
WHERE matchId = @oldMatchId
AND round >= @roundStart
AND round <= @roundEnd;

UPDATE survivor
SET matchId = @newMatchId
WHERE matchId = @oldMatchId
AND round >= @roundStart
AND round <= @roundEnd;

UPDATE pvp_ff
SET matchId = @newMatchId
WHERE matchId = @oldMatchId
AND round >= @roundStart
AND round <= @roundEnd;

UPDATE pvp_infdmg
SET matchId = @newMatchId
WHERE matchId = @oldMatchId
AND round >= @roundStart
AND round <= @roundEnd;

UPDATE matchlog
SET matchId = @newMatchId, startedAt = @newMatchId, endedAt = @roundEndTime
WHERE matchId = @oldMatchId
AND map = @finaleMap;