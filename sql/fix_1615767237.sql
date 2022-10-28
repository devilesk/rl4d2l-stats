--1615767237
--1615771267

select createdAt, matchId, map from round where createdAt LIKE '2021-03-14%';

select createdAt, matchId, map, round from round where matchId = 1615767237;
select createdAt, matchId, map, round from survivor where matchId = 1615767237;
select createdAt, matchId, map, round from infected where matchId = 1615767237;
select createdAt, matchId, map, round from pvp_ff where matchId = 1615767237;
select createdAt, matchId, map, round from pvp_infdmg where matchId = 1615767237;

select createdAt, matchId, map, round from round where matchId = 1615771267;
select createdAt, matchId, map, round from survivor where matchId = 1615771267;
select createdAt, matchId, map, round from infected where matchId = 1615771267;
select createdAt, matchId, map, round from pvp_ff where matchId = 1615771267;
select createdAt, matchId, map, round from pvp_infdmg where matchId = 1615771267;

update round set matchId = 1615767237 where matchId = 1615771267;
update survivor set matchId = 1615767237 where matchId = 1615771267;
update infected set matchId = 1615767237 where matchId = 1615771267;
update pvp_ff set matchId = 1615767237 where matchId = 1615771267;
update pvp_infdmg set matchId = 1615767237 where matchId = 1615771267;

select createdAt, matchId, map from matchlog where matchId = 1615771267;
update matchlog set matchId = 1615767237 where matchId = 1615771267;

select * from transaction where comment like '%1615771267';

update transaction set comment = 'match reward 1615767237' where comment like '%1615771267';

select createdAt, matchId, map, round from round where map = 'c7m3_port' and matchId = 1615767237;
select createdAt, matchId, map, round from survivor where map = 'c7m3_port' and matchId = 1615767237;
select createdAt, matchId, map, round from infected where map = 'c7m3_port' and matchId = 1615767237;
select createdAt, matchId, map, round from pvp_ff where map = 'c7m3_port' and matchId = 1615767237;
select createdAt, matchId, map, round from pvp_infdmg where map = 'c7m3_port' and matchId = 1615767237;

update round set round = 6 where map = 'c7m3_port' and matchId = 1615767237;
update survivor set round = 6 where map = 'c7m3_port' and matchId = 1615767237;
update infected set round = 6 where map = 'c7m3_port' and matchId = 1615767237;
update pvp_ff set round = 6 where map = 'c7m3_port' and matchId = 1615767237;
update pvp_infdmg set round = 6 where map = 'c7m3_port' and matchId = 1615767237;

update round set round = round - 1 where map = 'c7m3_port' and matchId = 1615767237;
update survivor set round = round - 1 where map = 'c7m3_port' and matchId = 1615767237;
update infected set round = round - 1 where map = 'c7m3_port' and matchId = 1615767237;
update pvp_ff set round = round - 1 where map = 'c7m3_port' and matchId = 1615767237;
update pvp_infdmg set round = round - 1 where map = 'c7m3_port' and matchId = 1615767237;