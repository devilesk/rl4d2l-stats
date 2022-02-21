--1572200468
--1572206503

select createdAt, matchId, map from round where createdAt LIKE '2019-10-27%';

select createdAt, matchId from round where createdAt LIKE '2019-10-27%' and matchId = 0;
select createdAt, matchId from survivor where createdAt LIKE '2019-10-27%' and matchId = 0;
select createdAt, matchId from infected where createdAt LIKE '2019-10-27%' and matchId = 0;
select createdAt, matchId from pvp_ff where createdAt LIKE '2019-10-27%' and matchId = 0;
select createdAt, matchId from pvp_infdmg where createdAt LIKE '2019-10-27%' and matchId = 0;

update round set matchId = 1572206503 where createdAt LIKE '2019-10-27%' and matchId = 0;
update survivor set matchId = 1572206503 where createdAt LIKE '2019-10-27%' and matchId = 0;
update infected set matchId = 1572206503 where createdAt LIKE '2019-10-27%' and matchId = 0;
update pvp_ff set matchId = 1572206503 where createdAt LIKE '2019-10-27%' and matchId = 0;
update pvp_infdmg set matchId = 1572206503 where createdAt LIKE '2019-10-27%' and matchId = 0;

select createdAt, matchId, map, round from round where matchId = 1572200468;
select createdAt, matchId, map, round from survivor where matchId = 1572200468;
select createdAt, matchId, map, round from infected where matchId = 1572200468;
select createdAt, matchId, map, round from pvp_ff where matchId = 1572200468;
select createdAt, matchId, map, round from pvp_infdmg where matchId = 1572200468;

select createdAt, matchId, map, round from round where matchId = 1572206503;
select createdAt, matchId, map, round from survivor where matchId = 1572206503;
select createdAt, matchId, map, round from infected where matchId = 1572206503;
select createdAt, matchId, map, round from pvp_ff where matchId = 1572206503;
select createdAt, matchId, map, round from pvp_infdmg where matchId = 1572206503;

update round set matchId = 1572200468 where matchId = 1572206503;
update survivor set matchId = 1572200468 where matchId = 1572206503;
update infected set matchId = 1572200468 where matchId = 1572206503;
update pvp_ff set matchId = 1572200468 where matchId = 1572206503;
update pvp_infdmg set matchId = 1572200468 where matchId = 1572206503;

select createdAt, matchId, map from matchlog where matchId = 1572206503;
update matchlog set matchId = 1572200468 where matchId = 1572206503;

select * from transaction where comment like '%1572206503';

update transaction set comment = 'match reward 1572200468' where comment like '%1572206503';

select matchId, round, map from round where matchId = 1572200468 and map = 'l4d2_stadium5_stadium';

update round set round = 5 where matchId = 1572200468 and map = 'l4d2_stadium5_stadium';