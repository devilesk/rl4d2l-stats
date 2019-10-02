CREATE TABLE IF NOT EXISTS `transaction` ( 
`id` INT NOT NULL auto_increment, 
`createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
`source` varchar(48), 
`target` varchar(48), 
`amount` INT, 
`type` INT, 
`wagerId` INT, 
`comment` varchar(256), 
`deleted` BOOLEAN, 
PRIMARY KEY  (`id`) 
);