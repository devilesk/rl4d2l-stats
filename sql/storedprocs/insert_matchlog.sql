DROP PROCEDURE IF EXISTS insert_match_log;

DELIMITER //

CREATE PROCEDURE insert_match_log(IN matchId INT, IN mode INT)
BEGIN

    SET @matchId = matchId;
    SET @mode = mode;
    
    IF @mode = 0 THEN
        SELECT a.matchId, a.map, 0 as deleted,
        IF(((a.teamATotal > a.teamBTotal) = (a.team = a.teamIsA)) = b.team, 1, -1) as result,
        b.steamid, d.rndStartTime as startedAt, a.rndEndTime as endedAt, b.team,
        p.name
        FROM round a
        JOIN survivor b
        ON a.matchId = b.matchId AND a.round = b.round AND a.map = b.map
        JOIN (SELECT * FROM round WHERE matchId = @matchId AND isSecondHalf = 1 AND deleted = 0 ORDER BY round DESC LIMIT 1) c
        ON a.matchId = c.matchId AND a.round = c.round AND a.map = c.map AND a.isSecondHalf = c.isSecondHalf
        JOIN players p ON p.steamid = b.steamid
        JOIN (SELECT rndStartTime FROM round WHERE matchId = @matchId AND isSecondHalf = 0 AND deleted = 0 ORDER BY round LIMIT 1) d
        WHERE a.deleted = 0 AND b.deleted = 0
        ORDER BY b.team;
    ELSE
        INSERT INTO matchlog (matchId, map, deleted, result, steamid, startedAt, endedAt, team)
        SELECT a.matchId, a.map, 0 as deleted,
        IF(((a.teamATotal > a.teamBTotal) = (a.team = a.teamIsA)) = b.team, 1, -1) as result,
        b.steamid, d.rndStartTime as startedAt, a.rndEndTime as endedAt, b.team
        FROM round a
        JOIN survivor b
        ON a.matchId = b.matchId AND a.round = b.round AND a.map = b.map
        JOIN (SELECT * FROM round WHERE matchId = @matchId AND isSecondHalf = 1 AND deleted = 0 ORDER BY round DESC LIMIT 1) c
        ON a.matchId = c.matchId AND a.round = c.round AND a.map = c.map AND a.isSecondHalf = c.isSecondHalf
        JOIN players p ON p.steamid = b.steamid
        JOIN (SELECT rndStartTime FROM round WHERE matchId = @matchId AND isSecondHalf = 0 AND deleted = 0 ORDER BY round LIMIT 1) d
        WHERE a.deleted = 0 AND b.deleted = 0
        ORDER BY b.team;
    END IF;

END //

DELIMITER ;