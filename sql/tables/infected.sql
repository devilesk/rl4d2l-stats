CREATE TABLE IF NOT EXISTS `infected` ( 
`id` INT NOT NULL auto_increment, 
`createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
`matchId` INT, 
`round` INT, 
`team` INT, 
`map` varchar(64), 
`steamid` varchar(32), 
`deleted` BOOLEAN, 
`isSecondHalf` BOOLEAN, 
`infDmgTotal` INT, 
`infDmgUpright` INT, 
`infDmgTank` INT, 
`infDmgTankIncap` INT, 
`infDmgScratch` INT, 
`infDmgScratchSmoker` INT, 
`infDmgScratchBoomer` INT, 
`infDmgScratchHunter` INT, 
`infDmgScratchCharger` INT, 
`infDmgScratchSpitter` INT, 
`infDmgScratchJockey` INT, 
`infDmgSpit` INT, 
`infDmgBoom` INT, 
`infDmgTankUp` INT, 
`infHunterDPs` INT, 
`infHunterDPDmg` INT, 
`infJockeyDPs` INT, 
`infDeathCharges` INT, 
`infCharges` INT, 
`infMultiCharges` INT, 
`infBoomsSingle` INT, 
`infBoomsDouble` INT, 
`infBoomsTriple` INT, 
`infBoomsQuad` INT, 
`infBooms` INT, 
`infBoomerPops` INT, 
`infLedged` INT, 
`infCommon` INT, 
`infSpawns` INT, 
`infSpawnSmoker` INT, 
`infSpawnBoomer` INT, 
`infSpawnHunter` INT, 
`infSpawnCharger` INT, 
`infSpawnSpitter` INT, 
`infSpawnJockey` INT, 
`infTankPasses` INT, 
`infTankRockHits` INT, 
`infCarsTriggered` INT, 
`infJockeyRideDuration` INT, 
`infJockeyRideTotal` INT, 
`infTimeStartPresent` INT, 
`infTimeStopPresent` INT, 
`infBoomsProxyTotal` INT, 
PRIMARY KEY  (`id`) 
);