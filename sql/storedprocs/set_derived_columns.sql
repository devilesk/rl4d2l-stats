DROP PROCEDURE IF EXISTS set_derived_columns;

DELIMITER //

CREATE PROCEDURE set_derived_columns()
BEGIN

    UPDATE survivor
    SET plyHeadshotsCISmg = plyHeadshotsSmg - plyHeadshotsSISmg
    WHERE plyHeadshotsCISmg IS NULL;

    UPDATE survivor
    SET plyHeadshotsCIPistol = plyHeadshotsPistol - plyHeadshotsSIPistol
    WHERE plyHeadshotsCIPistol IS NULL;

    UPDATE survivor
    SET plyHitsCISmg = plyHitsSmg - plyHitsSISmg - plyHitsTankSmg
    WHERE plyHitsCISmg IS NULL;

    UPDATE survivor
    SET plyHitsCIPistol = plyHitsPistol - plyHitsSIPistol - plyHitsTankPistol
    WHERE plyHitsCIPistol IS NULL;

    UPDATE survivor
    SET plyHeadshotsPctSISmg = COALESCE(plyHeadshotsSISmg / NULLIF(plyHitsSISmg, 0), 0)
    WHERE plyHeadshotsPctSISmg IS NULL;

    UPDATE survivor
    SET plyHeadshotsPctSIPistol = COALESCE(plyHeadshotsSIPistol / NULLIF(plyHitsSIPistol, 0), 0)
    WHERE plyHeadshotsPctSIPistol IS NULL;

    UPDATE survivor
    SET plyHeadshotsPctCISmg = COALESCE(plyHeadshotsCISmg / NULLIF(plyHitsCISmg, 0), 0)
    WHERE plyHeadshotsPctCISmg IS NULL;

    UPDATE survivor
    SET plyHeadshotsPctCIPistol = COALESCE(plyHeadshotsCIPistol / NULLIF(plyHitsCIPistol, 0), 0)
    WHERE plyHeadshotsPctCIPistol IS NULL;

    UPDATE infected
    SET infBoomsProxyTotal = infBooms - infBoomsQuad * 4 - infBoomsTriple * 3 - infBoomsDouble * 2 - infBoomsSingle
    WHERE infBoomsProxyTotal IS NULL;
    
    UPDATE infected
    SET infDmgTotalPerSpawn = COALESCE(infDmgTotal / NULLIF(infSpawns, 0), 0)
    WHERE infDmgTotalPerSpawn IS NULL;

    UPDATE infected
    SET infDmgUprightPerSpawn = COALESCE(infDmgUpright / NULLIF(infSpawns, 0), 0)
    WHERE infDmgUprightPerSpawn IS NULL;

    UPDATE infected
    SET infDmgTankPerSpawn = COALESCE(infDmgTank / NULLIF(infTankPasses, 0), 0)
    WHERE infDmgTankPerSpawn IS NULL;

    UPDATE infected
    SET infDmgTankIncapPerSpawn = COALESCE(infDmgTankIncap / NULLIF(infTankPasses, 0), 0)
    WHERE infDmgTankIncapPerSpawn IS NULL;

    UPDATE infected
    SET infDmgScratchPerSpawn = COALESCE(infDmgScratch / NULLIF(infSpawns, 0), 0)
    WHERE infDmgScratchPerSpawn IS NULL;

    UPDATE infected
    SET infDmgScratchSmokerPerSpawn = COALESCE(infDmgScratchSmoker / NULLIF(infSpawnSmoker, 0), 0)
    WHERE infDmgScratchSmokerPerSpawn IS NULL;

    UPDATE infected
    SET infDmgScratchBoomerPerSpawn = COALESCE(infDmgScratchBoomer / NULLIF(infSpawnBoomer, 0), 0)
    WHERE infDmgScratchBoomerPerSpawn IS NULL;

    UPDATE infected
    SET infDmgScratchHunterPerSpawn = COALESCE(infDmgScratchHunter / NULLIF(infSpawnHunter, 0), 0)
    WHERE infDmgScratchHunterPerSpawn IS NULL;

    UPDATE infected
    SET infDmgScratchChargerPerSpawn = COALESCE(infDmgScratchCharger / NULLIF(infSpawnCharger, 0), 0)
    WHERE infDmgScratchChargerPerSpawn IS NULL;

    UPDATE infected
    SET infDmgScratchSpitterPerSpawn = COALESCE(infDmgScratchSpitter / NULLIF(infSpawnSpitter, 0), 0)
    WHERE infDmgScratchSpitterPerSpawn IS NULL;

    UPDATE infected
    SET infDmgScratchJockeyPerSpawn = COALESCE(infDmgScratchJockey / NULLIF(infSpawnJockey, 0), 0)
    WHERE infDmgScratchJockeyPerSpawn IS NULL;

    UPDATE infected
    SET infDmgSpitPerSpawn = COALESCE(infDmgSpit / NULLIF(infSpawnSpitter, 0), 0)
    WHERE infDmgSpitPerSpawn IS NULL;

    UPDATE infected
    SET infDmgBoomPerSpawn = COALESCE(infDmgBoom / NULLIF(infSpawnBoomer, 0), 0)
    WHERE infDmgBoomPerSpawn IS NULL;

    UPDATE infected
    SET infDmgTankUpPerSpawn = COALESCE(infDmgTankUp / NULLIF(infSpawns, 0), 0)
    WHERE infDmgTankUpPerSpawn IS NULL;

    UPDATE infected
    SET infHunterDPsPerSpawn = COALESCE(infHunterDPs / NULLIF(infSpawnHunter, 0), 0)
    WHERE infHunterDPsPerSpawn IS NULL;

    UPDATE infected
    SET infHunterDPDmgPerSpawn = COALESCE(infHunterDPDmg / NULLIF(infSpawnHunter, 0), 0)
    WHERE infHunterDPDmgPerSpawn IS NULL;

    UPDATE infected
    SET infDeathChargesPerSpawn = COALESCE(infDeathCharges / NULLIF(infSpawnCharger, 0), 0)
    WHERE infDeathChargesPerSpawn IS NULL;

    UPDATE infected
    SET infChargesPerSpawn = COALESCE(infCharges / NULLIF(infSpawnCharger, 0), 0)
    WHERE infChargesPerSpawn IS NULL;

    UPDATE infected
    SET infMultiChargesPerSpawn = COALESCE(infMultiCharges / NULLIF(infSpawnCharger, 0), 0)
    WHERE infMultiChargesPerSpawn IS NULL;

    UPDATE infected
    SET infBoomsSinglePerSpawn = COALESCE(infBoomsSingle / NULLIF(infSpawnBoomer, 0), 0)
    WHERE infBoomsSinglePerSpawn IS NULL;

    UPDATE infected
    SET infBoomsDoublePerSpawn = COALESCE(infBoomsDouble / NULLIF(infSpawnBoomer, 0), 0)
    WHERE infBoomsDoublePerSpawn IS NULL;

    UPDATE infected
    SET infBoomsTriplePerSpawn = COALESCE(infBoomsTriple / NULLIF(infSpawnBoomer, 0), 0)
    WHERE infBoomsTriplePerSpawn IS NULL;

    UPDATE infected
    SET infBoomsQuadPerSpawn = COALESCE(infBoomsQuad / NULLIF(infSpawnBoomer, 0), 0)
    WHERE infBoomsQuadPerSpawn IS NULL;

    UPDATE infected
    SET infBoomsPerSpawn = COALESCE(infBooms / NULLIF(infSpawnBoomer, 0), 0)
    WHERE infBoomsPerSpawn IS NULL;

    UPDATE infected
    SET infBoomsProxyTotalPerSpawn = COALESCE(infBoomsProxyTotal / NULLIF(infSpawnBoomer, 0), 0)
    WHERE infBoomsProxyTotalPerSpawn IS NULL;

    UPDATE infected
    SET infBoomerPopsPerSpawn = COALESCE(infBoomerPops / NULLIF(infSpawnBoomer, 0), 0)
    WHERE infBoomerPopsPerSpawn IS NULL;

    UPDATE infected
    SET infLedgedPerSpawn = COALESCE(infLedged / NULLIF(infSpawns, 0), 0)
    WHERE infLedgedPerSpawn IS NULL;

    UPDATE infected
    SET infTankRockHitsPerSpawn = COALESCE(infTankRockHits / NULLIF(infTankPasses, 0), 0)
    WHERE infTankRockHitsPerSpawn IS NULL;

    UPDATE infected
    SET infCarsTriggeredPerSpawn = COALESCE(infCarsTriggered / NULLIF(infSpawns, 0), 0)
    WHERE infCarsTriggeredPerSpawn IS NULL;

    UPDATE infected
    SET infJockeyRideDurationPerSpawn = COALESCE(infJockeyRideDuration / NULLIF(infSpawnJockey, 0), 0)
    WHERE infJockeyRideDurationPerSpawn IS NULL;

    UPDATE infected
    SET infJockeyRideTotalPerSpawn = COALESCE(infJockeyRideTotal / NULLIF(infSpawnJockey, 0), 0)
    WHERE infJockeyRideTotalPerSpawn IS NULL;

END //

DELIMITER ;