const playerStatsQuery = discord => `SELECT a.plyCommon as kills,
a.plyHitsShotgun / a.plyShotsShotgun as shotgunAcc,
a.plyHitsSmg / a.plyShotsSmg as smgAcc,
a.plyHitsPistol / a.plyShotsPistol as pistolAcc,
a.plyTankDamage as tankdmg,
a.plySIDamage as sidmg,
a.round as round,
b.infDmgUpright as infdmg,
COALESCE(d.wins, 0) as wins,
COALESCE(e.loses, 0) as loses,
a.plyFFGiven as ff_given,
a.plyFFTaken as ff_taken,
a.plyIncaps as times_down,
b.infMultiBooms as multi_booms,
b.infBooms as booms,
b.infMultiCharges as multi_charge
FROM (
    SELECT steamid,
    SUM(plyCommon) as plyCommon,
    SUM(plyHitsShotgun) as plyHitsShotgun,
    SUM(plyHitsSmg) as plyHitsSmg,
    SUM(plyHitsPistol) as plyHitsPistol,
    SUM(plyShotsShotgun) as plyShotsShotgun,
    SUM(plyShotsSmg) as plyShotsSmg,
    SUM(plyShotsPistol) as plyShotsPistol,
    SUM(plyTankDamage) as plyTankDamage,
    SUM(plySIDamage) as plySIDamage,
    COUNT(*) as round,
    SUM(plyFFGiven) as plyFFGiven,
    SUM(plyFFTaken) as plyFFTaken,
    SUM(plyIncaps) as plyIncaps
    FROM survivor
    GROUP BY steamid
) a
JOIN (
    SELECT steamid,
    SUM(infDmgUpright) as infDmgUpright,
    SUM(infBooms) as infBooms,
    SUM(infMultiCharges) as infMultiCharges,
    SUM(infBoomsDouble + infBoomsTriple + infBoomsQuad) as infMultiBooms
    FROM infected
    GROUP BY steamid
) b
ON a.steamid = b.steamid
JOIN players c
ON a.steamid = c.steamid
LEFT JOIN (
    SELECT steamid, COUNT(*) as wins
    FROM matchlog
    WHERE result = 1
    GROUP BY steamid
) d
ON a.steamid = d.steamid
LEFT JOIN (
    SELECT steamid, COUNT(*) as loses
    FROM matchlog
    WHERE result = -1
    GROUP BY steamid
) e
ON a.steamid = e.steamid
WHERE c.discord = ${discord};`;

module.exports = playerStatsQuery;