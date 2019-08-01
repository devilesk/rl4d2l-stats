DROP PROCEDURE IF EXISTS fix_merged_match;

DELIMITER //

CREATE PROCEDURE fix_merged_match(IN oldMatchId INT, IN newMatchId INT, IN roundStart INT, IN roundEnd INT, IN finaleMap VARCHAR(64), IN mode INT)
BEGIN

    SET @oldMatchId = oldMatchId;
    SET @newMatchId = newMatchId;
    SET @roundStart = roundStart;
    SET @roundEnd = roundEnd;
    SET @finaleMap = finaleMap;
    SET @mode = mode;
    
    SET @startedAt = (SELECT rndStartTime FROM round WHERE matchId = @matchId AND round = @roundStart AND isSecondHalf = 0 AND deleted = 0 ORDER BY round LIMIT 1);
    SET @endedAt = (SELECT rndEndTime FROM round WHERE matchId = @matchId AND round = @roundEnd AND isSecondHalf = 1 AND deleted = 0 ORDER BY round LIMIT 1);
    
    IF @mode = 0 THEN
        SELECT @oldMatchId, @newMatchID, @roundStart, @roundEnd, @finaleMap, @startedAt, @endedAt;
        
        SELECT COUNT(*) FROM round
        WHERE matchId = @oldMatchId
        AND round >= @roundStart
        AND round <= @roundEnd
        GROUP BY matchId;

        SELECT COUNT(*) FROM infected
        WHERE matchId = @oldMatchId
        AND round >= @roundStart
        AND round <= @roundEnd
        GROUP BY matchId;

        SELECT COUNT(*) FROM survivor
        WHERE matchId = @oldMatchId
        AND round >= @roundStart
        AND round <= @roundEnd
        GROUP BY matchId;

        SELECT COUNT(*) FROM pvp_ff
        WHERE matchId = @oldMatchId
        AND round >= @roundStart
        AND round <= @roundEnd
        GROUP BY matchId;

        SELECT COUNT(*) FROM pvp_infdmg
        WHERE matchId = @oldMatchId
        AND round >= @roundStart
        AND round <= @roundEnd
        GROUP BY matchId;

        SELECT COUNT(*) FROM matchlog
        WHERE matchId = @oldMatchId
        AND map = @finaleMap
        GROUP BY matchId;
    ELSE
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
        SET matchId = @newMatchId, startedAt = @startedAt, endedAt = @endedAt
        WHERE matchId = @oldMatchId
        AND map = @finaleMap;
    END IF;

END //

DELIMITER ;