DROP PROCEDURE IF EXISTS delete_unfinished;

DELIMITER //

CREATE PROCEDURE delete_unfinished(IN _mode INT)
BEGIN
    SET @mode = _mode;
    
    IF @mode = 0 THEN
        SELECT COUNT(*) as round
        FROM round a
        LEFT JOIN matchlog b
        ON a.matchId = b.matchId
        WHERE a.deleted = 0 AND b.matchId IS NULL;

        SELECT COUNT(*) as infected
        FROM infected a
        LEFT JOIN matchlog b
        ON a.matchId = b.matchId
        WHERE a.deleted = 0 AND b.matchId IS NULL;

        SELECT COUNT(*) as survivor
        FROM survivor a
        LEFT JOIN matchlog b
        ON a.matchId = b.matchId
        WHERE a.deleted = 0 AND b.matchId IS NULL;

        SELECT COUNT(*) as pvp_ff
        FROM pvp_ff a
        LEFT JOIN matchlog b
        ON a.matchId = b.matchId
        WHERE a.deleted = 0 AND b.matchId IS NULL;

        SELECT COUNT(*) as pvp_infdmg
        FROM pvp_infdmg a
        LEFT JOIN matchlog b
        ON a.matchId = b.matchId
        WHERE a.deleted = 0 AND b.matchId IS NULL;

        SELECT COUNT(*) as leaguematchlog
        FROM leaguematchlog a
        LEFT JOIN matchlog b
        ON a.matchId = b.matchId
        WHERE a.deleted = 0 AND b.matchId IS NULL;
    ELSEIF @mode = 1 THEN
        UPDATE round a
        LEFT JOIN matchlog b
        ON a.matchId = b.matchId
        SET a.deleted = 1
        WHERE a.deleted = 0 AND b.matchId IS NULL;

        UPDATE infected a
        LEFT JOIN matchlog b
        ON a.matchId = b.matchId
        SET a.deleted = 1
        WHERE a.deleted = 0 AND b.matchId IS NULL;

        UPDATE survivor a
        LEFT JOIN matchlog b
        ON a.matchId = b.matchId
        SET a.deleted = 1
        WHERE a.deleted = 0 AND b.matchId IS NULL;

        UPDATE pvp_ff a
        LEFT JOIN matchlog b
        ON a.matchId = b.matchId
        SET a.deleted = 1
        WHERE a.deleted = 0 AND b.matchId IS NULL;

        UPDATE pvp_infdmg a
        LEFT JOIN matchlog b
        ON a.matchId = b.matchId
        SET a.deleted = 1
        WHERE a.deleted = 0 AND b.matchId IS NULL;

        UPDATE leaguematchlog a
        LEFT JOIN matchlog b
        ON a.matchId = b.matchId
        SET a.deleted = 1
        WHERE a.deleted = 0 AND b.matchId IS NULL;
    END IF;

END //

DELIMITER ;