SOURCE sql/tables/players.sql;

TRUNCATE TABLE players;

LOAD DATA LOCAL INFILE 'sql/seed/players.csv' 
INTO TABLE players
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n';