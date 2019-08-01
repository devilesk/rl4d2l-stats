CREATE TABLE IF NOT EXISTS `matchlog` ( 
`id` INT NOT NULL auto_increment, 
`createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
`matchId` INT, 
`map` varchar(64), 
`deleted` BOOLEAN, 
`result` INT, 
`steamid` varchar(32), 
`startedAt` INT, 
`endedAt` INT, 
`team` INT, 
PRIMARY KEY  (`id`) 
);