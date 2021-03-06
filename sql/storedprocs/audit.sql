DROP PROCEDURE IF EXISTS audit;

DELIMITER //

CREATE PROCEDURE audit()
BEGIN

    -- Matches with correct campaign count and correct number of rounds, but not starting from round 1
    SELECT a.matchId as 'bad round start', MIN(a.round), MAX(a.round), MAX(a.round) - MIN(a.round), COUNT(a.round), COUNT(DISTINCT b.campaign), MAX(b.campaign), MAX(b.round)
    FROM round a JOIN maps b ON a.map = b.map
    WHERE a.deleted = 0
    GROUP BY a.matchId
    HAVING COUNT(DISTINCT b.campaign) = 1
    AND MAX(a.round) - MIN(a.round) + 1 = MAX(b.round)
    AND COUNT(a.round) = 2 * MAX(b.round)
    AND MIN(a.round) <> 1;

    -- Matches with incorrect campaign count. Need to run fixmatch.sql to split them.
    SELECT a.matchId as 'bad campaign count', COUNT(DISTINCT b.campaign), GROUP_CONCAT(DISTINCT b.campaign)
    FROM round a JOIN maps b ON a.map = b.map
    WHERE a.deleted = 0
    GROUP BY a.matchId
    HAVING COUNT(DISTINCT b.campaign) <> 1;

    -- Matches with incorrect map count. Incomplete match?
    SELECT a.matchId as 'bad map count', MAX(a.round), MIN(a.round), MAX(a.round) - MIN(a.round) + 1, MAX(b.round), COUNT(DISTINCT a.map), COUNT(DISTINCT b.map)
    FROM round a JOIN maps b ON a.map = b.map
    WHERE a.deleted = 0
    GROUP BY a.matchId
    HAVING COUNT(DISTINCT a.map) <> COUNT(DISTINCT b.map);

    -- Matches with incorrect round count. Incomplete match?
    SELECT a.matchId as 'bad round start/end count', MAX(a.round), MIN(a.round), MAX(a.round) - MIN(a.round) + 1, MAX(b.round)
    FROM round a JOIN maps b ON a.map = b.map
    WHERE a.deleted = 0
    GROUP BY a.matchId
    HAVING MAX(a.round) - MIN(a.round) + 1 <> MAX(b.round);

    -- Matches with incorrect round count. Incomplete match?
    SELECT a.matchId as 'bad round total count', COUNT(a.round), MAX(b.round), 2 * MAX(b.round)
    FROM round a JOIN maps b ON a.map = b.map
    WHERE a.deleted = 0
    GROUP BY a.matchId
    HAVING COUNT(a.round) <> 2 * MAX(b.round);

END //

DELIMITER ;