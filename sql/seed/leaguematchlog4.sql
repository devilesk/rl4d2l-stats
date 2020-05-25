/*
 * resultCode
 * 0 Normal result
 * 1 Double forfeit
 * 2 Bye
 * 3 TBD
 * 4 Forfeit
 */

-- Helix    STEAM_1:0:149140939
-- Autoattack   STEAM_1:1:43423378
-- DonHam   STEAM_1:0:47577131
-- Roragok  STEAM_1:0:25095868
-- TonyZeSnipa  STEAM_1:0:18881716
-- Wicket   STEAM_1:0:41878654
-- Gofu STEAM_1:1:128593

-- Week One: Ends 5/31 - Dead Center
-- Wicket v Tony
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
'c1m4_atrium',
4,
0,
1,
0,
'STEAM_1:0:41878654',
'STEAM_1:0:18881716',
3
);
-- Don Ham v Helix
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
'c1m4_atrium',
4,
0,
1,
0,
'STEAM_1:0:47577131',
'STEAM_1:0:149140939',
3
);
-- Auto v Gofu
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
'c1m4_atrium',
4,
0,
1,
0,
'STEAM_1:1:43423378',
'STEAM_1:1:128593',
3
);
-- Roragok BYE
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
'c1m4_atrium',
4,
0,
1,
0,
'STEAM_1:0:25095868',
'',
2
);

-- Week Two: Ends 6/7 - No Mercy
-- Wicket v Auto
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
'c8m5_rooftop',
4,
0,
2,
0,
'STEAM_1:0:41878654',
'STEAM_1:1:43423378',
3
);
-- Roragok v Gofu
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
'c8m5_rooftop',
4,
0,
2,
0,
'STEAM_1:0:25095868',
'STEAM_1:1:128593',
3
);
-- Don Ham v Tony
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
'c8m5_rooftop',
4,
0,
2,
0,
'STEAM_1:0:47577131',
'STEAM_1:0:18881716',
3
);
-- Helix BYE
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
'c8m5_rooftop',
4,
0,
2,
0,
'STEAM_1:0:149140939',
'',
2
);

-- Week Three: Ends 6/14 - Dark Carnival
-- Wicket v Don Ham
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
'c2m5_concert',
4,
0,
3,
0,
'STEAM_1:0:41878654',
'STEAM_1:0:47577131',
3
);
-- Roragok v Auto
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
'c2m5_concert',
4,
0,
3,
0,
'STEAM_1:0:25095868',
'STEAM_1:1:43423378',
3
);
-- Helix v Gofu
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
'c2m5_concert',
4,
0,
3,
0,
'STEAM_1:0:149140939',
'STEAM_1:1:128593',
3
);
-- TonyZeSnipa BYE
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
'c2m5_concert',
4,
0,
3,
0,
'STEAM_1:0:18881716',
'',
2
);

-- Week Four: Ends 6/21 - Dead Air
-- Wicket v Roragok
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
4,
0,
4,
0,
'STEAM_1:0:41878654',
'STEAM_1:0:25095868',
3
);
-- Auto v Helix
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
4,
0,
4,
0,
'STEAM_1:1:43423378',
'STEAM_1:0:149140939',
3
);
-- Gofu v Tony
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
4,
0,
4,
0,
'STEAM_1:1:128593',
'STEAM_1:0:18881716',
3
);
-- Don Ham BYE
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
4,
0,
4,
0,
'STEAM_1:0:47577131',
'',
2
);

-- Week Five: Ends 6/28 - Downpour
-- Helix v Roragok
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
'dprm5_milltown_escape',
4,
0,
5,
0,
'STEAM_1:0:149140939',
'STEAM_1:0:25095868',
3
);
-- Gofu v Don Ham
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
'dprm5_milltown_escape',
4,
0,
5,
0,
'STEAM_1:1:128593',
'STEAM_1:0:47577131',
3
);
-- Tony v Auto
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
'dprm5_milltown_escape',
4,
0,
5,
0,
'STEAM_1:0:18881716',
'STEAM_1:1:43423378',
3
);
-- Wicket BYE
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
'dprm5_milltown_escape',
4,
0,
5,
0,
'STEAM_1:0:41878654',
'',
2
);

-- Week Six: Ends 7/5 - Suicide Blitz
-- Wicket v Helix
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
4,
0,
6,
0,
'STEAM_1:0:41878654',
'STEAM_1:0:149140939',
3
);
-- Tony v Roragok
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
4,
0,
6,
0,
'STEAM_1:0:18881716',
'STEAM_1:0:25095868',
3
);
-- Auto v Don Ham
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
4,
0,
6,
0,
'STEAM_1:1:43423378',
'STEAM_1:0:47577131',
3
);
-- Gofu BYE
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
4,
0,
6,
0,
'STEAM_1:1:128593',
'',
2
);

-- Week Seven: Ends 7/12 - Parish
-- Wicket v Gofu
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
'c5m5_bridge',
4,
0,
7,
0,
'STEAM_1:0:41878654',
'STEAM_1:1:128593',
3
);
-- Tony v Helix
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
'c5m5_bridge',
4,
0,
7,
0,
'STEAM_1:0:18881716',
'STEAM_1:0:149140939',
3
);
-- Don Ham v Roragok
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
'c5m5_bridge',
4,
0,
7,
0,
'STEAM_1:0:47577131',
'STEAM_1:0:25095868',
3
);
-- Autoattacks BYE
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
'c5m5_bridge',
4,
0,
7,
0,
'STEAM_1:1:43423378',
'',
2
);
