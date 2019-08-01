CREATE TABLE IF NOT EXISTS `players` ( 
`id` INT NOT NULL auto_increment, 
`createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
`name` varchar(128), 
`discord` varchar(48), 
`steamid` varchar(32), 
PRIMARY KEY  (`id`) 
);