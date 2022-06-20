--1647110158
--1647112396

select createdAt, matchId, map from round where createdAt LIKE '2022-03-12%';

select createdAt, matchId, map, round from round where matchId = 1647110158;
select createdAt, matchId, map, round from survivor where matchId = 1647110158;
select createdAt, matchId, map, round from infected where matchId = 1647110158;
select createdAt, matchId, map, round from pvp_ff where matchId = 1647110158;
select createdAt, matchId, map, round from pvp_infdmg where matchId = 1647110158;

select createdAt, matchId, map, round from round where matchId = 1647112396;
select createdAt, matchId, map, round from survivor where matchId = 1647112396;
select createdAt, matchId, map, round from infected where matchId = 1647112396;
select createdAt, matchId, map, round from pvp_ff where matchId = 1647112396;
select createdAt, matchId, map, round from pvp_infdmg where matchId = 1647112396;

select createdAt, matchId, map, round, team, isSecondHalf from round where (matchId = 1647110158 or matchId = 1647112396) and map = 'c12m2_traintunnel' order by createdAt, round;
select createdAt, matchId, map, round, team, steamid, isSecondHalf from survivor where (matchId = 1647110158 or matchId = 1647112396) and map = 'c12m2_traintunnel' order by createdAt, round, steamid;
select createdAt, matchId, map, round, team, steamid, isSecondHalf from infected where (matchId = 1647110158 or matchId = 1647112396) and map = 'c12m2_traintunnel' order by createdAt, round, steamid;
select createdAt, matchId, map, round, team, steamid, isSecondHalf from pvp_ff where (matchId = 1647110158 or matchId = 1647112396) and map = 'c12m2_traintunnel' order by createdAt, round, steamid;
select createdAt, matchId, map, round, team, steamid, isSecondHalf from pvp_infdmg where (matchId = 1647110158 or matchId = 1647112396) and map = 'c12m2_traintunnel' order by createdAt, round, steamid;

select createdAt, matchId, map, round, team, isSecondHalf from round where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3 and team = 0;
select createdAt, matchId, map, round, team, steamid, isSecondHalf from survivor where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3 and team = 0;
select createdAt, matchId, map, round, team, steamid, isSecondHalf from infected where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3 and team = 0;
select createdAt, matchId, map, round, team, steamid, isSecondHalf from pvp_ff where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3 and team = 0;
select createdAt, matchId, map, round, team, steamid, isSecondHalf from pvp_infdmg where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3 and team = 0;

delete from round where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3 and team = 0;
delete from survivor where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3 and team = 0;
delete from infected where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3 and team = 0;
delete from pvp_ff where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3 and team = 0;
delete from pvp_infdmg where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3 and team = 0;

select createdAt, matchId, map, round, team, isSecondHalf from round where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3;
select createdAt, matchId, map, round, team, steamid, isSecondHalf from survivor where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3;
select createdAt, matchId, map, round, team, steamid, isSecondHalf from infected where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3;
select createdAt, matchId, map, round, team, steamid, isSecondHalf from pvp_ff where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3;
select createdAt, matchId, map, round, team, steamid, isSecondHalf from pvp_infdmg where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3;

update round set matchId = 1647110158, round = 2 where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3;
update survivor set matchId = 1647110158, round = 2 where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3;
update infected set matchId = 1647110158, round = 2 where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3;
update pvp_ff set matchId = 1647110158, round = 2 where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3;
update pvp_infdmg set matchId = 1647110158, round = 2 where matchId = 1647112396 and map = 'c12m2_traintunnel' and round = 3;

update round set matchId = 1647110158 where matchId = 1647112396;
update survivor set matchId = 1647110158 where matchId = 1647112396;
update infected set matchId = 1647110158 where matchId = 1647112396;
update pvp_ff set matchId = 1647110158 where matchId = 1647112396;
update pvp_infdmg set matchId = 1647110158 where matchId = 1647112396;

select createdAt, matchId, map from matchlog where matchId = 1647112396;
update matchlog set matchId = 1647110158 where matchId = 1647112396;

select * from transaction where comment like '%1647112396';
update transaction set comment = 'match reward 1647110158' where comment like '%1647112396';

select id, createdAt, matchId, map, teamIsA, teamARound, teamATotal, teamBRound, teamBTotal from round where createdAt LIKE '2022-03-12%' and matchId = '1647110158' order by createdAt;

update round set teamIsA = 0, teamARound = 551, teamATotal = 757, teamBRound = 164, teamBTotal = 365 where id = 7825;
update round set teamIsA = 1, teamARound = 475, teamATotal = 1232, teamBRound = 0, teamBTotal = 365 where id = 7826;
update round set teamIsA = 0, teamARound = 475, teamATotal = 1232, teamBRound = 316, teamBTotal = 681 where id = 7827;
update round set teamIsA = 1, teamARound = 349, teamATotal = 1581, teamBRound = 0, teamBTotal = 681 where id = 7828;
update round set teamIsA = 0, teamARound = 349, teamATotal = 1581, teamBRound = 338, teamBTotal = 1019 where id = 7829;
update round set teamIsA = 1, teamARound = 372, teamATotal = 1953, teamBRound = 0, teamBTotal = 1019 where id = 7830;
update round set teamIsA = 0, teamARound = 372, teamATotal = 1953, teamBRound = 583, teamBTotal = 1602 where id = 7831;

update survivor set team = isSecondHalf where matchId = 1647110158;
update infected set team = isSecondHalf where matchId = 1647110158;
update pvp_ff set team = isSecondHalf where matchId = 1647110158;
update pvp_infdmg set team = isSecondHalf where matchId = 1647110158;

select matchId, round, map from round where matchId = 1647110158 and map = 'c12m3_bridge';
select matchId, round, map from round where matchId = 1647110158 and map = 'c12m4_barn';
select matchId, round, map from round where matchId = 1647110158 and map = 'c12m5_cornfield';

update round set round = 3 where matchId = 1647110158 and map = 'c12m3_bridge';
update round set round = 4 where matchId = 1647110158 and map = 'c12m4_barn';
update round set round = 5 where matchId = 1647110158 and map = 'c12m5_cornfield';

update survivor set round = 3 where matchId = 1647110158 and map = 'c12m3_bridge';
update survivor set round = 4 where matchId = 1647110158 and map = 'c12m4_barn';
update survivor set round = 5 where matchId = 1647110158 and map = 'c12m5_cornfield';

update infected set round = 3 where matchId = 1647110158 and map = 'c12m3_bridge';
update infected set round = 4 where matchId = 1647110158 and map = 'c12m4_barn';
update infected set round = 5 where matchId = 1647110158 and map = 'c12m5_cornfield';

update pvp_ff set round = 3 where matchId = 1647110158 and map = 'c12m3_bridge';
update pvp_ff set round = 4 where matchId = 1647110158 and map = 'c12m4_barn';
update pvp_ff set round = 5 where matchId = 1647110158 and map = 'c12m5_cornfield';

update pvp_infdmg set round = 3 where matchId = 1647110158 and map = 'c12m3_bridge';
update pvp_infdmg set round = 4 where matchId = 1647110158 and map = 'c12m4_barn';
update pvp_infdmg set round = 5 where matchId = 1647110158 and map = 'c12m5_cornfield';