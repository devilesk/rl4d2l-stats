const playerStatsQuery = (discord, seasonal) => `SELECT a.plyCommon as kills,
IF(a.plyShotsShotgun != 0, a.plyHitsShotgun / a.plyShotsShotgun, 0) as shotgunAcc,
IF(a.plyShotsSmg != 0, a.plyHitsSmg / a.plyShotsSmg, 0) as smgAcc,
IF(a.plyShotsPistol != 0, a.plyHitsPistol / a.plyShotsPistol, 0) as pistolAcc,
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
    SELECT a.steamid,
    SUM(a.plyCommon) as plyCommon,
    SUM(a.plyHitsShotgun) as plyHitsShotgun,
    SUM(a.plyHitsSmg) as plyHitsSmg,
    SUM(a.plyHitsPistol) as plyHitsPistol,
    SUM(a.plyShotsShotgun) as plyShotsShotgun,
    SUM(a.plyShotsSmg) as plyShotsSmg,
    SUM(a.plyShotsPistol) as plyShotsPistol,
    SUM(a.plyTankDamage) as plyTankDamage,
    SUM(a.plySIDamage) as plySIDamage,
    COUNT(*) as round,
    SUM(a.plyFFGiven) as plyFFGiven,
    SUM(a.plyFFTaken) as plyFFTaken,
    SUM(a.plyIncaps) as plyIncaps
    FROM survivor a
    ${seasonal ? 'JOIN (SELECT startedAt, endedAt FROM season ORDER BY season DESC LIMIT 1) c' : ''}
    WHERE a.deleted = 0
    ${seasonal ? 'AND a.matchId >= c.startedAt AND a.matchId <= c.endedAt' : ''}
    GROUP BY a.steamid
) a
JOIN (
    SELECT a.steamid,
    SUM(a.infDmgUpright) as infDmgUpright,
    SUM(a.infBooms) as infBooms,
    SUM(a.infMultiCharges) as infMultiCharges,
    SUM(a.infBoomsDouble + infBoomsTriple + infBoomsQuad) as infMultiBooms
    FROM infected a
    ${seasonal ? 'JOIN (SELECT startedAt, endedAt FROM season ORDER BY season DESC LIMIT 1) c' : ''}
    WHERE a.deleted = 0
    ${seasonal ? 'AND a.matchId >= c.startedAt AND a.matchId <= c.endedAt' : ''}
    GROUP BY a.steamid
) b
ON a.steamid = b.steamid
JOIN players c
ON a.steamid = c.steamid
LEFT JOIN (
    SELECT a.steamid, COUNT(*) as wins
    FROM matchlog a
    ${seasonal ? 'JOIN (SELECT startedAt, endedAt FROM season ORDER BY season DESC LIMIT 1) c' : ''}
    WHERE a.result = 1 AND a.deleted = 0
    ${seasonal ? 'AND a.matchId >= c.startedAt AND a.matchId <= c.endedAt' : ''}
    GROUP BY a.steamid
) d
ON a.steamid = d.steamid
LEFT JOIN (
    SELECT a.steamid, COUNT(*) as loses
    FROM matchlog a
    ${seasonal ? 'JOIN (SELECT startedAt, endedAt FROM season ORDER BY season DESC LIMIT 1) c' : ''}
    WHERE a.result = -1 AND a.deleted = 0
    ${seasonal ? 'AND a.matchId >= c.startedAt AND a.matchId <= c.endedAt' : ''}
    GROUP BY a.steamid
) e
ON a.steamid = e.steamid
WHERE c.discord = ${discord};`;

module.exports = playerStatsQuery;
