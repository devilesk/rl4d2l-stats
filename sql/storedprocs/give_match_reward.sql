DROP PROCEDURE IF EXISTS give_match_reward;

DELIMITER //

CREATE PROCEDURE give_match_reward(IN _mode INT, IN _matchId INT, IN _amount INT, IN _startingAmount INT)
BEGIN
    SET @mode = _mode;
    SET @matchId = _matchId;
    SET @amount = _amount;
    SET @startingAmount = _startingAmount;
    
    SELECT @matchId, @amount, @startingAmount;
    
    IF @mode = 0 THEN
        SELECT a.discord, _startingAmount, 15, 'initial bankroll', 0
        FROM players a
        LEFT JOIN bankroll b ON a.discord = b.userId
        WHERE a.discord IS NOT NULL and b.userId IS NULL;
        
        SELECT a.discord, _startingAmount, 0
        FROM players a
        LEFT JOIN bankroll b ON a.discord = b.userId
        WHERE a.discord IS NOT NULL and b.userId IS NULL;
        
        SELECT a.discord, @amount, 15, CONCAT('match reward ', @matchId), 0
        FROM players a
        JOIN matchlog b ON a.steamid = b.steamid
        WHERE b.matchId = @matchId;
        
        SELECT c.matchId, b.name, b.discord, a.amount, a.amount + @amount
        FROM bankroll a
        JOIN players b ON a.userId = b.discord
        JOIN matchlog c ON b.steamid = c.steamid
        WHERE c.matchId = @matchId;
    ELSEIF @mode = 1 THEN
        -- make sure all registered players have an initial bankroll
        INSERT INTO transaction (source, amount, type, comment, deleted)
        SELECT a.discord, _startingAmount, 15, 'initial bankroll', 0
        FROM players a
        LEFT JOIN bankroll b ON a.discord = b.userId
        WHERE a.discord IS NOT NULL and b.userId IS NULL;

        INSERT INTO bankroll (userId, amount, deleted)
        SELECT a.discord, _startingAmount, 0
        FROM players a
        LEFT JOIN bankroll b ON a.discord = b.userId
        WHERE a.discord IS NOT NULL and b.userId IS NULL;

        -- give match reward
        INSERT INTO transaction (source, amount, type, comment, deleted)
        SELECT a.discord, @amount, 15, CONCAT('match reward ', @matchId), 0
        FROM players a
        JOIN matchlog b ON a.steamid = b.steamid
        WHERE b.matchId = @matchId;
        
        UPDATE bankroll a
        JOIN players b ON a.userId = b.discord
        JOIN matchlog c ON b.steamid = c.steamid
        SET a.amount = a.amount + @amount
        WHERE c.matchId = @matchId;
    END IF;
END //

DELIMITER ;