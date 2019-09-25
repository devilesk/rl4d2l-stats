CREATE TABLE IF NOT EXISTS `leaguematchlog` ( 
`id` INT NOT NULL auto_increment, 
`createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
`matchId` INT, 
`map` varchar(64), 
`season` INT, 
`playoffs` BOOLEAN, 
`round` INT, 
`deleted` BOOLEAN, 
`winner` varchar(32), 
`loser` varchar(32), 
`resultCode` INT, 
PRIMARY KEY  (`id`) 
);