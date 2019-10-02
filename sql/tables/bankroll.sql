CREATE TABLE IF NOT EXISTS `bankroll` ( 
`id` INT NOT NULL auto_increment, 
`createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
`userId` varchar(48), 
`amount` INT, 
`deleted` BOOLEAN, 
PRIMARY KEY  (`id`) 
);