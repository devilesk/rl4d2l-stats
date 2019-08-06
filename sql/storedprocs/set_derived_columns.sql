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
    SET infBoomsProxyOnly = infSpawnBoomer - infBoomsQuad - infBoomsTriple - infBoomsDouble - infBoomsSingle - infBoomerPops
    WHERE infBoomsProxyOnly IS NULL;

    UPDATE infected
    SET infBoomsPct = COALESCE((infSpawnBoomer - infBoomerPops) / NULLIF(infSpawnBoomer, 0), 0)
    WHERE infBoomsPct IS NULL;

    UPDATE infected
    SET infBoomsPopPct = COALESCE(infBoomerPops / NULLIF(infSpawnBoomer, 0), 0)
    WHERE infBoomsPopPct IS NULL;

END //

DELIMITER ;