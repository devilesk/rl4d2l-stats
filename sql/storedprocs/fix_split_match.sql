DROP PROCEDURE IF EXISTS fix_split_match;

DELIMITER //

CREATE PROCEDURE fix_split_match(IN _mode INT, IN _matchId INT, IN _newMatchId INT)
BEGIN
    SELECT "start";
    
    SET @mode = _mode;
    SET @matchId = _matchId;
    SET @newMatchId = _newMatchId;
    
    SELECT @matchId, @newMatchID;
    
    IF @mode = 0 THEN
        SELECT matchId, COUNT(*) FROM round
        WHERE matchId = @matchId;

        SELECT matchId, COUNT(*) FROM infected
        WHERE matchId = @matchId;

        SELECT matchId, COUNT(*) FROM survivor
        WHERE matchId = @matchId;

        SELECT matchId, COUNT(*) FROM pvp_ff
        WHERE matchId = @matchId;

        SELECT matchId, COUNT(*) FROM pvp_infdmg
        WHERE matchId = @matchId;

        SELECT matchId, COUNT(*) FROM matchlog
        WHERE matchId = @matchId;

        SELECT matchId, COUNT(*) FROM leaguematchlog
        WHERE matchId = @matchId;
    ELSEIF @mode = 1 THEN
        UPDATE round
        SET matchId = @newMatchId
        WHERE matchId = @matchId;

        UPDATE infected
        SET matchId = @newMatchId
        WHERE matchId = @matchId;

        UPDATE survivor
        SET matchId = @newMatchId
        WHERE matchId = @matchId;

        UPDATE pvp_ff
        SET matchId = @newMatchId
        WHERE matchId = @matchId;

        UPDATE pvp_infdmg
        SET matchId = @newMatchId
        WHERE matchId = @matchId;

        UPDATE matchlog
        SET matchId = @newMatchId
        WHERE matchId = @matchId;

        UPDATE leaguematchlog
        SET matchId = @newMatchId
        WHERE matchId = @matchId;
        
        UPDATE transaction
        SET comment = CONCAT('match reward ', @newMatchId);
        WHERE matchId = CONCAT('match reward ', @matchId);
    END IF;

END //

DELIMITER ;