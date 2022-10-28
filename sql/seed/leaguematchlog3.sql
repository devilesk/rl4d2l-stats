/*
 * resultCode
 * 0 Normal result
 * 1 Double forfeit
 * 2 Bye
 * 3 TBD
 * 4 Forfeit
 */
 
-- Autoattack   STEAM_1:1:43423378
-- Gofu STEAM_1:1:128593
-- et   STEAM_1:0:63094033
-- Coahre   STEAM_1:0:57515849
-- Wicket   STEAM_1:0:41878654
-- Roragok  STEAM_1:0:25095868
-- TonyZeSnipa  STEAM_1:0:18881716
-- BLeh STEAM_1:1:3449200

--  W1 Undead Zone  uz_escape
--  Auto > ET   1580354451
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1580354451,
'uz_escape',
3,
0,
1,
0,
'STEAM_1:1:43423378',
'STEAM_1:0:63094033',
0
);
--  Roragok < Wicket    1580088486
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1580088486,
'uz_escape',
3,
0,
1,
0,
'STEAM_1:0:41878654',
'STEAM_1:0:25095868',
0
);
--  Gofu > Bleh 1580612797
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1580612797,
'uz_escape',
3,
0,
1,
0,
'STEAM_1:1:128593',
'STEAM_1:1:3449200',
0
);
--  Coahre < Tony  1580433318
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1580433318,
'uz_escape',
3,
0,
1,
0,
'STEAM_1:0:18881716',
'STEAM_1:0:57515849',
0
);

--  W2 Hard Rain: Downpour  dprm5_milltown_escape
--  Wicket > Auto 1581045033
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1581045033,
'dprm5_milltown_escape',
3,
0,
2,
0,
'STEAM_1:0:41878654',
'STEAM_1:1:43423378',
0
);
--  Tony > Gofu 1581135160
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1581135160,
'dprm5_milltown_escape',
3,
0,
2,
0,
'STEAM_1:0:18881716',
'STEAM_1:1:128593',
0
);
--  Bleh > Coahre   1581210111
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1581210111,
'dprm5_milltown_escape',
3,
0,
2,
0,
'STEAM_1:1:3449200',
'STEAM_1:0:57515849',
0
);
--  et < Roragok   1581302103
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1581302103,
'dprm5_milltown_escape',
3,
0,
2,
0,
'STEAM_1:0:25095868',
'STEAM_1:0:63094033',
0
);

--  W3 Diescraper Redux l4d2_diescraper4_top_361
--  Bleh < Roragok  1581556936
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1581556936,
'l4d2_diescraper4_top_361',
3,
0,
3,
0,
'STEAM_1:0:25095868',
'STEAM_1:1:3449200',
0
);
--  Wicket > Tony   1581649533
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1581649533,
'l4d2_diescraper4_top_361',
3,
0,
3,
0,
'STEAM_1:0:41878654',
'STEAM_1:0:18881716',
0
);
--  Gofu > Auto 1581649453
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1581649453,
'l4d2_diescraper4_top_361',
3,
0,
3,
0,
'STEAM_1:1:128593',
'STEAM_1:1:43423378',
0
);
--  Coahre > et FF
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
0,
'l4d2_diescraper4_top_361',
3,
0,
3,
0,
'STEAM_1:0:57515849',
'STEAM_1:0:63094033',
4
);

--  W4 Parish   c5m5_bridge
--  Wicket > Gofu  1582253766
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1582253766,
'c5m5_bridge',
3,
0,
4,
0,
'STEAM_1:0:41878654',
'STEAM_1:1:128593',
0
);
--  Roragok > Tony  1582160484
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1582160484,
'c5m5_bridge',
3,
0,
4,
0,
'STEAM_1:0:25095868',
'STEAM_1:0:18881716',
0
);
--  Auto > Coahre   1582420504
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1582420504,
'c5m5_bridge',
3,
0,
4,
0,
'STEAM_1:1:43423378',
'STEAM_1:0:57515849',
0
);
--  Bleh < et  1582506151
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1582506151,
'c5m5_bridge',
3,
0,
4,
0,
'STEAM_1:0:63094033',
'STEAM_1:1:3449200',
0
);

--  W5 Blood Harvest    c12m5_cornfield
--  Wicket < Roragok    1582858840
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1582858840,
'c12m5_cornfield',
3,
0,
5,
0,
'STEAM_1:0:25095868',
'STEAM_1:0:41878654',
0
);
--  Auto < Tony    1583207964
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1583207964,
'c12m5_cornfield',
3,
0,
5,
0,
'STEAM_1:0:18881716',
'STEAM_1:1:43423378',
0
);
--  Gofu < et  1583213259
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1583213259,
'c12m5_cornfield',
3,
0,
5,
0,
'STEAM_1:0:63094033',
'STEAM_1:1:128593',
0
);
--  Bleh > Coahre   FF
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
0,
'c12m5_cornfield',
3,
0,
5,
0,
'STEAM_1:1:3449200',
'STEAM_1:0:57515849',
4
);

--  W6 Dead Air c11m5_runway
--  Roragok > Auto 1583463451
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1583463451,
'c11m5_runway',
3,
0,
6,
0,
'STEAM_1:0:25095868',
'STEAM_1:1:43423378',
0
);
--  Wicket > Bleh  1584068711
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1584068711,
'c11m5_runway',
3,
0,
6,
0,
'STEAM_1:0:41878654',
'STEAM_1:1:3449200',
0
);
--  Tony > et   1583468436
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1583468436,
'c11m5_runway',
3,
0,
6,
0,
'STEAM_1:0:18881716',
'STEAM_1:0:63094033',
0
);
--  Gofu > Coahre FF
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
0,
'c11m5_runway',
3,
0,
6,
0,
'STEAM_1:1:128593',
'STEAM_1:0:57515849',
4
);

-- Playoffs R1 Suicide Blitz 2 l4d2_stadium5_stadium
-- Roragok  Bye
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
0,
'l4d2_stadium5_stadium',
3,
1,
1,
0,
'STEAM_1:0:25095868',
'',
2
);
-- Auto < Gofu 1585443560
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1585443560,
'l4d2_stadium5_stadium',
3,
1,
1,
0,
'STEAM_1:1:128593',
'STEAM_1:1:43423378',
0
);
-- Tony < et   1584760239
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1584760239,
'l4d2_stadium5_stadium',
3,
1,
1,
0,
'STEAM_1:0:63094033',
'STEAM_1:0:18881716',
0
);
-- Wicket > Bleh   1585524957
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1585524957,
'l4d2_stadium5_stadium',
3,
1,
1,
0,
'STEAM_1:0:41878654',
'STEAM_1:1:3449200',
0
);

-- gofu > roragok 1586044840   c11m5_runway
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1586044840,
'c11m5_runway',
3,
1,
2,
0,
'STEAM_1:1:128593',
'STEAM_1:0:25095868',
0
);
-- et < wicket    1586311100   dprm5_milltown_escape
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1586311100,
'dprm5_milltown_escape',
3,
1,
2,
0,
'STEAM_1:0:41878654',
'STEAM_1:0:63094033',
0
);

-- gofu < wicket 1586649685    c10m5_houseboat
INSERT INTO leaguematchlog (
matchId, 
map, 
season, 
playoffs, 
round,
deleted,
winner,
loser,
resultCode
) VALUES (
1586649685,
'c10m5_houseboat',
3,
1,
3,
0,
'STEAM_1:0:41878654',
'STEAM_1:1:128593',
0
);