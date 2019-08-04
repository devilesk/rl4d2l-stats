DROP PROCEDURE IF EXISTS fix_merged_match;

DELIMITER //

CREATE PROCEDURE fix_merged_match(IN _mode INT, IN _matchId INT, IN _roundStart INT, IN _roundEnd INT)
BEGIN
    SELECT "start";
    
    SET @mode = _mode;
    SET @matchId = _matchId;
    SET @roundStart = _roundStart;
    SET @roundEnd = _roundEnd;
    
    SET @startedAt = (SELECT rndStartTime FROM round WHERE matchId = @matchId AND round = @roundStart AND isSecondHalf = 0 AND deleted = 0 ORDER BY round LIMIT 1);
    SET @endedAt = (SELECT rndEndTime FROM round WHERE matchId = @matchId AND round = @roundEnd AND isSecondHalf = 1 AND deleted = 0 ORDER BY round LIMIT 1);
    SET @newMatchId = @startedAt;
    SET @finaleMap = (SELECT map FROM round WHERE matchId = @matchId AND round = @roundEnd AND isSecondHalf = 1 AND deleted = 0 ORDER BY round LIMIT 1);

    SELECT @matchId, @newMatchID, @roundStart, @roundEnd, @finaleMap, @startedAt, @endedAt;
    
    IF @mode = 0 THEN
        SELECT @matchId, @newMatchID, @roundStart, @roundEnd, @finaleMap, @startedAt, @endedAt;
        
        SELECT matchId, COUNT(*) FROM round
        WHERE matchId = @matchId
        AND round >= @roundStart
        AND round <= @roundEnd
        GROUP BY matchId;

        SELECT matchId, COUNT(*) FROM infected
        WHERE matchId = @matchId
        AND round >= @roundStart
        AND round <= @roundEnd
        GROUP BY matchId;

        SELECT matchId, COUNT(*) FROM survivor
        WHERE matchId = @matchId
        AND round >= @roundStart
        AND round <= @roundEnd
        GROUP BY matchId;

        SELECT matchId, COUNT(*) FROM pvp_ff
        WHERE matchId = @matchId
        AND round >= @roundStart
        AND round <= @roundEnd
        GROUP BY matchId;

        SELECT matchId, COUNT(*) FROM pvp_infdmg
        WHERE matchId = @matchId
        AND round >= @roundStart
        AND round <= @roundEnd
        GROUP BY matchId;

        SELECT matchId, COUNT(*) FROM matchlog
        WHERE matchId = @matchId
        AND map = @finaleMap
        GROUP BY matchId;
    ELSEIF @mode = 1 THEN
        UPDATE round
        SET matchId = @newMatchId
        WHERE matchId = @matchId
        AND round >= @roundStart
        AND round <= @roundEnd;

        UPDATE infected
        SET matchId = @newMatchId
        WHERE matchId = @matchId
        AND round >= @roundStart
        AND round <= @roundEnd;

        UPDATE survivor
        SET matchId = @newMatchId
        WHERE matchId = @matchId
        AND round >= @roundStart
        AND round <= @roundEnd;

        UPDATE pvp_ff
        SET matchId = @newMatchId
        WHERE matchId = @matchId
        AND round >= @roundStart
        AND round <= @roundEnd;

        UPDATE pvp_infdmg
        SET matchId = @newMatchId
        WHERE matchId = @matchId
        AND round >= @roundStart
        AND round <= @roundEnd;

        UPDATE matchlog
        SET matchId = @newMatchId, startedAt = @startedAt, endedAt = @endedAt
        WHERE matchId = @matchId
        AND map = @finaleMap;
    END IF;

END //

DELIMITER ;