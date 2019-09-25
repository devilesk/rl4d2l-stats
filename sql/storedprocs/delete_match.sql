DROP PROCEDURE IF EXISTS delete_match;

DELIMITER //

CREATE PROCEDURE delete_match(IN _mode INT, IN _matchId INT)
BEGIN
    SET @mode = _mode;
    SET @matchId = _matchId;
    
    IF @mode = 0 THEN
        SELECT @matchId;
        
        SELECT 'round', matchId, COUNT(*) FROM round
        WHERE matchId = @matchId AND deleted = 0
        GROUP BY matchId;

        SELECT 'infected', matchId, COUNT(*) FROM infected
        WHERE matchId = @matchId AND deleted = 0
        GROUP BY matchId;

        SELECT 'survivor', matchId, COUNT(*) FROM survivor
        WHERE matchId = @matchId AND deleted = 0
        GROUP BY matchId;

        SELECT 'pvp_ff', matchId, COUNT(*) FROM pvp_ff
        WHERE matchId = @matchId AND deleted = 0
        GROUP BY matchId;

        SELECT 'pvp_infdmg', matchId, COUNT(*) FROM pvp_infdmg
        WHERE matchId = @matchId AND deleted = 0
        GROUP BY matchId;

        SELECT 'matchlog', matchId, COUNT(*) FROM matchlog
        WHERE matchId = @matchId AND deleted = 0
        GROUP BY matchId;

        SELECT 'leaguematchlog', matchId, COUNT(*) FROM leaguematchlog
        WHERE matchId = @matchId AND deleted = 0
        GROUP BY matchId;
    ELSEIF @mode = 1 THEN
        UPDATE round
        SET deleted = 1
        WHERE matchId = @matchId AND deleted = 0;

        UPDATE infected
        SET deleted = 1
        WHERE matchId = @matchId AND deleted = 0;

        UPDATE survivor
        SET deleted = 1
        WHERE matchId = @matchId AND deleted = 0;

        UPDATE pvp_ff
        SET deleted = 1
        WHERE matchId = @matchId AND deleted = 0;

        UPDATE pvp_infdmg
        SET deleted = 1
        WHERE matchId = @matchId AND deleted = 0;

        UPDATE matchlog
        SET deleted = 1
        WHERE matchId = @matchId AND deleted = 0;

        UPDATE leaguematchlog
        SET deleted = 1
        WHERE matchId = @matchId AND deleted = 0;
    END IF;

END //

DELIMITER ;