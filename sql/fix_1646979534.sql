--1646979534
--1646983236

select createdAt, matchId, map from round where createdAt LIKE '2022-03-11%';

select createdAt, matchId, map, round from round where matchId = 1646979534;
select createdAt, matchId, map, round from survivor where matchId = 1646979534;
select createdAt, matchId, map, round from infected where matchId = 1646979534;
select createdAt, matchId, map, round from pvp_ff where matchId = 1646979534;
select createdAt, matchId, map, round from pvp_infdmg where matchId = 1646979534;

select createdAt, matchId, map, round from round where matchId = 1646983236;
select createdAt, matchId, map, round from survivor where matchId = 1646983236;
select createdAt, matchId, map, round from infected where matchId = 1646983236;
select createdAt, matchId, map, round from pvp_ff where matchId = 1646983236;
select createdAt, matchId, map, round from pvp_infdmg where matchId = 1646983236;

update round set matchId = 1646979534 where matchId = 1646983236;
update survivor set matchId = 1646979534 where matchId = 1646983236;
update infected set matchId = 1646979534 where matchId = 1646983236;
update pvp_ff set matchId = 1646979534 where matchId = 1646983236;
update pvp_infdmg set matchId = 1646979534 where matchId = 1646983236;

select createdAt, matchId, map from matchlog where matchId = 1646983236;
update matchlog set matchId = 1646979534 where matchId = 1646983236;

select * from transaction where comment like '%1646983236';
update transaction set comment = 'match reward 1646979534' where comment like '%1646983236';

select matchId, round, map from round where matchId = 1646979534 and map = 'uz_escape';
select matchId, round, map from survivor where matchId = 1646979534 and map = 'uz_escape';
select matchId, round, map from infected where matchId = 1646979534 and map = 'uz_escape';
select matchId, round, map from pvp_ff where matchId = 1646979534 and map = 'uz_escape';
select matchId, round, map from pvp_infdmg where matchId = 1646979534 and map = 'uz_escape';

update round set round = 5 where matchId = 1646979534 and map = 'uz_escape';
update survivor set round = 5 where matchId = 1646979534 and map = 'uz_escape';
update infected set round = 5 where matchId = 1646979534 and map = 'uz_escape';
update pvp_ff set round = 5 where matchId = 1646979534 and map = 'uz_escape';
update pvp_infdmg set round = 5 where matchId = 1646979534 and map = 'uz_escape';