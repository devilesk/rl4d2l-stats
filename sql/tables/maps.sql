CREATE TABLE IF NOT EXISTS `maps` ( 
`id` INT NOT NULL auto_increment, 
`createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
`map` varchar(128), 
`campaign` varchar(128), 
`round` INT, 
PRIMARY KEY  (`id`) 
);