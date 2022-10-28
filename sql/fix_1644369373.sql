--1644369373
--1644374251

select createdAt, matchId, map from round where createdAt LIKE '2022-02-08%';

select createdAt, matchId, map, round from round where matchId = 1644369373;
select createdAt, matchId, map, round from survivor where matchId = 1644369373;
select createdAt, matchId, map, round from infected where matchId = 1644369373;
select createdAt, matchId, map, round from pvp_ff where matchId = 1644369373;
select createdAt, matchId, map, round from pvp_infdmg where matchId = 1644369373;

select createdAt, matchId, map, round from round where matchId = 1644374251;
select createdAt, matchId, map, round from survivor where matchId = 1644374251;
select createdAt, matchId, map, round from infected where matchId = 1644374251;
select createdAt, matchId, map, round from pvp_ff where matchId = 1644374251;
select createdAt, matchId, map, round from pvp_infdmg where matchId = 1644374251;

update round set matchId = 1644369373 where matchId = 1644374251;
update survivor set matchId = 1644369373 where matchId = 1644374251;
update infected set matchId = 1644369373 where matchId = 1644374251;
update pvp_ff set matchId = 1644369373 where matchId = 1644374251;
update pvp_infdmg set matchId = 1644369373 where matchId = 1644374251;

select createdAt, matchId, map from matchlog where matchId = 1644374251;
update matchlog set matchId = 1644369373 where matchId = 1644374251;

select * from transaction where comment like '%1644374251';

update transaction set comment = 'match reward 1644369373' where comment like '%1644374251';

select createdAt, matchId, map, round from round where map = 'c7m3_port' and matchId = 1644369373;
select createdAt, matchId, map, round from survivor where map = 'c7m3_port' and matchId = 1644369373;
select createdAt, matchId, map, round from infected where map = 'c7m3_port' and matchId = 1644369373;
select createdAt, matchId, map, round from pvp_ff where map = 'c7m3_port' and matchId = 1644369373;
select createdAt, matchId, map, round from pvp_infdmg where map = 'c7m3_port' and matchId = 1644369373;

update round set round = 6 where map = 'c7m3_port' and matchId = 1644369373;
update survivor set round = 6 where map = 'c7m3_port' and matchId = 1644369373;
update infected set round = 6 where map = 'c7m3_port' and matchId = 1644369373;
update pvp_ff set round = 6 where map = 'c7m3_port' and matchId = 1644369373;
update pvp_infdmg set round = 6 where map = 'c7m3_port' and matchId = 1644369373;

update round set round = round - 1 where map = 'c7m3_port' and matchId = 1644369373;
update survivor set round = round - 1 where map = 'c7m3_port' and matchId = 1644369373;
update infected set round = round - 1 where map = 'c7m3_port' and matchId = 1644369373;
update pvp_ff set round = round - 1 where map = 'c7m3_port' and matchId = 1644369373;
update pvp_infdmg set round = round - 1 where map = 'c7m3_port' and matchId = 1644369373;