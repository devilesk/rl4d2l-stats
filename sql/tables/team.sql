CREATE TABLE IF NOT EXISTS `team` ( 
`id` INT NOT NULL auto_increment, 
`createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
`season` INT, 
`draftOrder` INT, 
`seed` INT, 
`wins` INT, 
`losses` INT, 
`name` varchar(64), 
`deleted` BOOLEAN, 
`steamid_0` varchar(32), 
`steamid_1` varchar(32), 
`steamid_2` varchar(32), 
`steamid_3` varchar(32), 
`logoImage` varchar(256), 
PRIMARY KEY  (`id`) 
);