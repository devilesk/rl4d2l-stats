CREATE TABLE IF NOT EXISTS `wager` ( 
`id` INT NOT NULL auto_increment, 
`createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
`betId` INT, 
`userId` varchar(48), 
`choice` varchar(64), 
`amount` INT, 
`createdTimestamp` INT, 
`deleted` BOOLEAN, 
PRIMARY KEY  (`id`) 
);