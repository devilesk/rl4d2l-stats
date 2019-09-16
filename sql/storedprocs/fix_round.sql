DROP PROCEDURE IF EXISTS fix_round;

DELIMITER //

CREATE PROCEDURE fix_round(IN _mode INT)
BEGIN

    SET @mode = _mode;
    SELECT @mode;
    
    SELECT a.matchId, MIN(a.round), MAX(a.round), MAX(a.round) - MIN(a.round), COUNT(a.round), COUNT(DISTINCT b.campaign), COUNT(DISTINCT a.map), COUNT(DISTINCT b.map), MAX(b.campaign), MAX(b.round)
    FROM round a JOIN maps b ON a.map = b.map
    WHERE a.deleted = 0
    GROUP BY a.matchId
    HAVING COUNT(DISTINCT b.campaign) = 1
    AND COUNT(DISTINCT a.map) = COUNT(DISTINCT b.map)
    AND COUNT(a.round) = 2 * MAX(b.round)
    AND MIN(a.round) <> 1;

    IF @mode = 1 THEN
        DROP TEMPORARY TABLE IF EXISTS badMatchIds;
        CREATE TEMPORARY TABLE badMatchIds
        SELECT a.matchId
        FROM round a JOIN maps b ON a.map = b.map
        WHERE a.deleted = 0
        GROUP BY a.matchId
        HAVING COUNT(DISTINCT b.campaign) = 1
        AND COUNT(DISTINCT a.map) = COUNT(DISTINCT b.map)
        AND COUNT(a.round) = 2 * MAX(b.round)
        AND MIN(a.round) <> 1;

        UPDATE round a
        JOIN badMatchIds b ON a.matchId = b.matchId
        JOIN maps c ON a.map = c.map
        SET a.round = c.round;

        UPDATE infected a
        JOIN badMatchIds b ON a.matchId = b.matchId
        JOIN maps c ON a.map = c.map
        SET a.round = c.round;

        UPDATE survivor a
        JOIN badMatchIds b ON a.matchId = b.matchId
        JOIN maps c ON a.map = c.map
        SET a.round = c.round;

        UPDATE pvp_ff a
        JOIN badMatchIds b ON a.matchId = b.matchId
        JOIN maps c ON a.map = c.map
        SET a.round = c.round;

        UPDATE pvp_infdmg a
        JOIN badMatchIds b ON a.matchId = b.matchId
        JOIN maps c ON a.map = c.map
        SET a.round = c.round;

        DROP TEMPORARY TABLE IF EXISTS badMatchIds;
    END IF;

END //

DELIMITER ;