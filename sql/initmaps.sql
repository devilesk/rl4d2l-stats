-- Recreate maps table from maps.csv

DROP TABLE IF EXISTS maps;

CREATE TABLE IF NOT EXISTS `maps` ( 
`id` INT NOT NULL auto_increment, 
`createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
`map` varchar(128), 
`campaign` varchar(128), 
`round` INT, 
PRIMARY KEY  (`id`) 
);

LOAD DATA LOCAL INFILE 'seed/maps.csv' 
INTO TABLE maps
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n';