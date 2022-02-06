UPDATE transaction
SET comment = 'match reward 1590448513'
WHERE comment = 'match reward 1590453242';

UPDATE pvp_infdmg
SET matchId = 1590448513
WHERE matchId = 1590453242;

UPDATE pvp_ff
SET matchId = 1590448513
WHERE matchId = 1590453242;

UPDATE matchlog
SET matchId = 1590448513
WHERE matchId = 1590453242;

UPDATE round
SET matchId = 1590448513
WHERE matchId = 1590453242;

UPDATE survivor
SET matchId = 1590448513
WHERE matchId = 1590453242;

UPDATE infected
SET matchId = 1590448513
WHERE matchId = 1590453242;