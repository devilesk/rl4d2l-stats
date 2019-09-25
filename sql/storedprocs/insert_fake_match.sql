DROP PROCEDURE IF EXISTS insert_fake_match;

DELIMITER //

CREATE PROCEDURE  insert_fake_match(IN _matchId INT, IN _maps VARCHAR(256))
BEGIN

    SET @matchId = _matchId;
    SET @round = -1;
    SET @maps = _maps;
    SELECT p.steamids 
    FROM (
        SELECT 0 as x, GROUP_CONCAT(t.steamid SEPARATOR ',') as steamids
        FROM (SELECT steamid FROM players
        WHERE steamid <> 'BOT' AND steamid <> ''
        ORDER BY RAND()
        LIMIT 8) as t
        GROUP BY x) as p
    LIMIT 1
    INTO @steamIds;

    SET @steamIds = CONCAT(@steamIds, ',');
    SET @result = rand_int(0, 1);

    WHILE (LOCATE(',', @maps) > 0)
    DO
        SET @map = SUBSTRING(@maps, 1, LOCATE(',',@maps)-1);
        SET @maps= SUBSTRING(@maps, LOCATE(',',@maps) + 1);
        SET @round = @round + 1;
        SET @half = 0;
        
        WHILE (@half < 2)
        DO
            
            SET @players = @steamIds;
            SET @p = 0;
            
            WHILE (LOCATE(',', @players) > 0)
            DO
                
                SET @steamId = SUBSTRING(@players, 1, LOCATE(',',@players)-1);
                SET @players= SUBSTRING(@players, LOCATE(',',@players) + 1);
                SET @presult = @result;
                SET @team = 0;
                IF @p >= 4 THEN
                    SET @presult = 1 - @presult;
                    SET @team = 1;
                END IF;
                
                IF @presult = 0 THEN
                    SET @presult = -1;
                END IF;
                
                IF ((@half = 0 AND @p < 4) OR (@half = 1 AND @p >= 4)) THEN
                    INSERT INTO survivor (
                    matchId, 
                    round, 
                    team, 
                    map, 
                    steamid, 
                    deleted, 
                    isSecondHalf, 
                    plyShotsShotgun, 
                    plyShotsSmg, 
                    plyShotsSniper, 
                    plyShotsPistol, 
                    plyHitsShotgun, 
                    plyHitsSmg, 
                    plyHitsSniper, 
                    plyHitsPistol, 
                    plyHeadshotsSmg, 
                    plyHeadshotsSniper, 
                    plyHeadshotsPistol, 
                    plyHeadshotsSISmg, 
                    plyHeadshotsSISniper, 
                    plyHeadshotsSIPistol, 
                    plyHitsSIShotgun, 
                    plyHitsSISmg, 
                    plyHitsSISniper, 
                    plyHitsSIPistol, 
                    plyHitsTankShotgun, 
                    plyHitsTankSmg, 
                    plyHitsTankSniper, 
                    plyHitsTankPistol, 
                    plyCommon, 
                    plyCommonTankUp, 
                    plySIKilled, 
                    plySIKilledTankUp, 
                    plySIDamage, 
                    plySIDamageTankUp, 
                    plyIncaps, 
                    plyDied, 
                    plySkeets, 
                    plySkeetsHurt, 
                    plySkeetsMelee, 
                    plyLevels, 
                    plyLevelsHurt, 
                    plyPops, 
                    plyCrowns, 
                    plyCrownsHurt, 
                    plyShoves, 
                    plyDeadStops, 
                    plyTongueCuts, 
                    plySelfClears, 
                    plyFallDamage, 
                    plyDmgTaken, 
                    plyDmgTakenBoom, 
                    plyDmgTakenCommon, 
                    plyDmgTakenTank, 
                    plyBowls, 
                    plyCharges, 
                    plyDeathCharges, 
                    plyFFGiven, 
                    plyFFTaken, 
                    plyFFHits, 
                    plyTankDamage, 
                    plyWitchDamage, 
                    plyMeleesOnTank, 
                    plyRockSkeets, 
                    plyRockEats, 
                    plyFFGivenPellet, 
                    plyFFGivenBullet, 
                    plyFFGivenSniper, 
                    plyFFGivenMelee, 
                    plyFFGivenFire, 
                    plyFFGivenIncap, 
                    plyFFGivenOther, 
                    plyFFGivenSelf, 
                    plyFFTakenPellet, 
                    plyFFTakenBullet, 
                    plyFFTakenSniper, 
                    plyFFTakenMelee, 
                    plyFFTakenFire, 
                    plyFFTakenIncap, 
                    plyFFTakenOther, 
                    plyFFGivenTotal, 
                    plyFFTakenTotal, 
                    plyCarsTriggered, 
                    plyJockeyRideDuration, 
                    plyJockeyRideTotal, 
                    plyClears, 
                    plyAvgClearTime, 
                    plyTimeStartPresent, 
                    plyTimeStopPresent, 
                    plyTimeStartAlive, 
                    plyTimeStopAlive, 
                    plyTimeStartUpright, 
                    plyTimeStopUpright,
                    plyCurFlowDist,
                    plyFarFlowDist,
                    plyProtectAwards
                    ) VALUES (
                    @matchId,
                    @round+1,
                    @half,
                    @map,
                    @steamId,
                    0,
                    @half,
                    rand_int(100, 200), 
                    rand_int(100, 200), 
                    rand_int(100, 200), 
                    rand_int(100, 200), 
                    rand_int(50, 99), 
                    rand_int(50, 99), 
                    rand_int(50, 99), 
                    rand_int(50, 99), 
                    rand_int(25, 49), 
                    rand_int(25, 49), 
                    rand_int(25, 49), 
                    rand_int(0, 11), 
                    rand_int(0, 11), 
                    rand_int(0, 11), 
                    rand_int(12, 24),  
                    rand_int(12, 24),  
                    rand_int(12, 24),  
                    rand_int(12, 24),  
                    rand_int(50, 99), 
                    rand_int(50, 99), 
                    rand_int(50, 99), 
                    rand_int(50, 99), 
                    rand_int(50, 99), 
                    rand_int(50, 99), 
                    rand_int(0, 10), 
                    rand_int(0, 10), 
                    rand_int(0, 1000), 
                    rand_int(0, 1000), 
                    rand_int(0, 3), 
                    rand_int(0, 3), 
                    rand_int(0, 3), 
                    rand_int(0, 3), 
                    rand_int(0, 3), 
                    rand_int(0, 3), 
                    rand_int(0, 3), 
                    rand_int(0, 3), 
                    rand_int(0, 3), 
                    rand_int(0, 3), 
                    rand_int(0, 3), 
                    rand_int(0, 3), 
                    rand_int(0, 3), 
                    rand_int(0, 3), 
                    rand_int(0, 500), 
                    rand_int(0, 500), 
                    rand_int(0, 500), 
                    rand_int(0, 500),  
                    rand_int(0, 500), 
                    rand_int(0, 10), 
                    rand_int(0, 10), 
                    rand_int(0, 10), 
                    rand_int(0, 100), 
                    rand_int(0, 100), 
                    rand_int(0, 100), 
                    rand_int(0, 1000), 
                    rand_int(0, 1000), 
                    rand_int(0, 10), 
                    rand_int(0, 10), 
                    rand_int(0, 10), 
                    rand_int(0, 10),  
                    rand_int(0, 10),  
                    rand_int(0, 10),  
                    rand_int(0, 10), 
                    rand_int(0, 10), 
                    rand_int(0, 10), 
                    rand_int(0, 10), 
                    rand_int(0, 10), 
                    rand_int(0, 10),  
                    rand_int(0, 10),  
                    rand_int(0, 10),  
                    rand_int(0, 10), 
                    rand_int(0, 10), 
                    rand_int(0, 10), 
                    rand_int(0, 10), 
                    rand_int(0, 10), 
                    rand_int(0, 10), 
                    rand_int(0, 3),  
                    rand_int(0, 100), 
                    rand_int(0, 10), 
                    rand_int(0, 10), 
                    rand_int(0, 5), 
                    0, 
                    0, 
                    0, 
                    0, 
                    0, 
                    0,
                    rand_int(0, 500), 
                    rand_int(0, 500),
                    rand_int(0, 100)
                    );
                    
                    SET @victims = @steamIds;
                    SET @v = 0;
                    
                    WHILE (LOCATE(',', @victims) > 0)
                    DO
                        
                        SET @vicSteamId = SUBSTRING(@victims, 1, LOCATE(',',@victims)-1);
                        SET @victims= SUBSTRING(@victims, LOCATE(',',@victims) + 1);
                        SET @victeam = 0;
                        IF @v >= 4 THEN
                            SET @victeam = 1;
                        END IF;
                        
                        IF @team = @victeam THEN
                            INSERT INTO pvp_ff (
                            matchId, 
                            round, 
                            team, 
                            map, 
                            steamid, 
                            deleted, 
                            isSecondHalf, 
                            victim,
                            damage
                            ) VALUES (
                            @matchId,
                            @round+1,
                            @half,
                            @map,
                            @steamId,
                            0,
                            @half,
                            @vicSteamId,
                            rand_int(0, 25)
                            );
                        END IF;
                        
                        SET @v = @v + 1;

                    END WHILE;
                ELSE
                    INSERT INTO infected ( 
                    matchId, 
                    round, 
                    team, 
                    map, 
                    steamid, 
                    deleted, 
                    isSecondHalf, 
                    infDmgTotal, 
                    infDmgUpright, 
                    infDmgTank, 
                    infDmgTankIncap, 
                    infDmgScratch, 
                    infDmgScratchSmoker, 
                    infDmgScratchBoomer, 
                    infDmgScratchHunter, 
                    infDmgScratchCharger, 
                    infDmgScratchSpitter, 
                    infDmgScratchJockey, 
                    infDmgSpit, 
                    infDmgBoom, 
                    infDmgTankUp, 
                    infHunterDPs, 
                    infHunterDPDmg, 
                    infJockeyDPs, 
                    infDeathCharges, 
                    infCharges, 
                    infMultiCharges, 
                    infBoomsSingle, 
                    infBoomsDouble, 
                    infBoomsTriple, 
                    infBoomsQuad, 
                    infBooms, 
                    infBoomerPops, 
                    infLedged, 
                    infCommon, 
                    infSpawns, 
                    infSpawnSmoker, 
                    infSpawnBoomer, 
                    infSpawnHunter, 
                    infSpawnCharger, 
                    infSpawnSpitter, 
                    infSpawnJockey, 
                    infTankPasses, 
                    infTankRockHits, 
                    infCarsTriggered, 
                    infJockeyRideDuration, 
                    infJockeyRideTotal, 
                    infTimeStartPresent, 
                    infTimeStopPresent 
                    ) VALUES (
                    @matchId,
                    @round+1,
                    @half,
                    @map,
                    @steamId,
                    0,
                    @half,
                    rand_int(100, 500), 
                    rand_int(100, 500), 
                    rand_int(100, 500), 
                    rand_int(100, 500), 
                    rand_int(100, 500), 
                    rand_int(100, 500), 
                    rand_int(100, 500), 
                    rand_int(100, 500), 
                    rand_int(100, 500), 
                    rand_int(100, 500), 
                    rand_int(100, 500), 
                    rand_int(100, 500), 
                    rand_int(100, 500), 
                    rand_int(100, 500), 
                    rand_int(0, 5), 
                    rand_int(0, 100), 
                    rand_int(0, 5), 
                    rand_int(0, 5), 
                    rand_int(0, 5), 
                    rand_int(0, 5),  
                    rand_int(0, 5), 
                    rand_int(0, 5), 
                    rand_int(0, 5), 
                    rand_int(0, 5), 
                    rand_int(0, 5), 
                    rand_int(0, 5), 
                    rand_int(0, 5), 
                    rand_int(0, 5), 
                    rand_int(0, 5), 
                    rand_int(0, 5), 
                    rand_int(0, 5), 
                    rand_int(0, 5), 
                    rand_int(0, 5),  
                    rand_int(0, 5),  
                    rand_int(0, 5), 
                    rand_int(0, 5), 
                    rand_int(0, 5),  
                    rand_int(0, 5), 
                    rand_int(0, 5), 
                    rand_int(0, 5), 
                    0, 
                    0
                    );
                    
                    SET @victims = @steamIds;
                    SET @v = 0;
                    
                    WHILE (LOCATE(',', @victims) > 0)
                    DO
                        
                        SET @vicSteamId = SUBSTRING(@victims, 1, LOCATE(',',@victims)-1);
                        SET @victims= SUBSTRING(@victims, LOCATE(',',@victims) + 1);
                        SET @victeam = 0;
                        IF @v >= 4 THEN
                            SET @victeam = 1;
                        END IF;
                        
                        IF @team <> @victeam THEN
                            INSERT INTO pvp_infdmg (
                            matchId, 
                            round, 
                            team, 
                            map, 
                            steamid, 
                            deleted, 
                            isSecondHalf, 
                            victim,
                            damage
                            ) VALUES (
                            @matchId,
                            @round+1,
                            @half,
                            @map,
                            @steamId,
                            0,
                            @half,
                            @vicSteamId,
                            rand_int(0, 25)
                            );
                        END IF;
                        
                        SET @v = @v + 1;

                    END WHILE;

                END IF;
                
                IF ((LOCATE(',', @maps) <= 0) AND @half = 1) THEN
                    INSERT INTO matchlog (
                    matchId, 
                    map, 
                    deleted, 
                    result, 
                    steamid, 
                    startedAt, 
                    endedAt, 
                    team,
                    configName
                    ) VALUES (
                    @matchId,
                    @map,
                    0,
                    @presult,
                    @steamId,
                    1562680772,
                    1562684372,
                    @team,
                    'zonemod'
                    );
                END IF;
                
                SET @p = @p + 1;

            END WHILE;
            
            INSERT INTO round ( 
            matchId, 
            round, 
            team, 
            map, 
            deleted, 
            isSecondHalf, 
            teamIsA, 
            teamARound, 
            teamATotal, 
            teamBRound, 
            teamBTotal, 
            survivorCount, 
            maxCompletionScore, 
            maxFlowDist, 
            rndRestarts, 
            rndPillsUsed, 
            rndKitsUsed, 
            rndDefibsUsed, 
            rndCommon, 
            rndSIKilled, 
            rndSIDamage, 
            rndSISpawned, 
            rndWitchKilled, 
            rndTankKilled, 
            rndIncaps, 
            rndDeaths, 
            rndFFDamageTotal, 
            rndStartTime, 
            rndEndTime, 
            rndStartTimePause, 
            rndStopTimePause, 
            rndStartTimeTank, 
            rndStopTimeTank,
            configName
            ) VALUES (
            @matchId,
            @round+1,
            @half,
            @map,
            0,
            @half,
            1 - @half, 
            rand_int(100, 500), 
            rand_int(100, 2000), 
            rand_int(100, 500), 
            rand_int(100, 2000), 
            rand_int(0, 4), 
            rand_int(500, 800), 
            rand_int(500, 800), 
            0, 
            rand_int(0, 10), 
            0, 
            0, 
            rand_int(100, 300), 
            rand_int(0, 25), 
            rand_int(100, 500), 
            rand_int(0, 25), 
            0, 
            rand_int(0, 1), 
            rand_int(0, 10), 
            rand_int(0, 4), 
            rand_int(0, 250), 
            0, 
            0, 
            0, 
            0, 
            0, 
            0,
            'zonemod'
            );
            
            SET @half = @half + 1;
        END WHILE;
    END WHILE;

END //

DELIMITER ;