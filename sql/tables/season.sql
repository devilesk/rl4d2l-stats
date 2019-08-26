CREATE TABLE IF NOT EXISTS `season` ( 
`id` INT NOT NULL auto_increment, 
`createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
`season` INT, 
`startedAt` INT, 
`endedAt` INT, 
PRIMARY KEY  (`id`) 
);