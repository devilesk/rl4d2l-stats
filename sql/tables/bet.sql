CREATE TABLE IF NOT EXISTS `bet` ( 
`id` INT NOT NULL auto_increment, 
`createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
`name` varchar(128), 
`choices` varchar(256), 
`winner` varchar(64), 
`status` INT, 
`createdTimestamp` INT, 
`endTimestamp` INT, 
`lockTimestamp` INT, 
`closeTimestamp` INT, 
`deleted` BOOLEAN, 
PRIMARY KEY  (`id`) 
);