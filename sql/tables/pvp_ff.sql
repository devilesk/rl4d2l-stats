CREATE TABLE IF NOT EXISTS `pvp_ff` ( 
`id` INT NOT NULL auto_increment, 
`createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
`matchId` INT, 
`round` INT, 
`team` INT, 
`map` varchar(64), 
`steamid` varchar(32), 
`deleted` BOOLEAN, 
`isSecondHalf` BOOLEAN, 
`victim` varchar(32), 
`damage` INT, 
PRIMARY KEY  (`id`) 
);