--1603656150
--1603658480

select createdAt, matchId, map from round where createdAt LIKE '2020-10-25%';

select createdAt, matchId, map, round from round where matchId = 1603656150;
select createdAt, matchId, map, round from survivor where matchId = 1603656150;
select createdAt, matchId, map, round from infected where matchId = 1603656150;
select createdAt, matchId, map, round from pvp_ff where matchId = 1603656150;
select createdAt, matchId, map, round from pvp_infdmg where matchId = 1603656150;

select createdAt, matchId, map, round from round where matchId = 1603658480;
select createdAt, matchId, map, round from survivor where matchId = 1603658480;
select createdAt, matchId, map, round from infected where matchId = 1603658480;
select createdAt, matchId, map, round from pvp_ff where matchId = 1603658480;
select createdAt, matchId, map, round from pvp_infdmg where matchId = 1603658480;

update round set matchId = 1603656150 where matchId = 1603658480;
update survivor set matchId = 1603656150 where matchId = 1603658480;
update infected set matchId = 1603656150 where matchId = 1603658480;
update pvp_ff set matchId = 1603656150 where matchId = 1603658480;
update pvp_infdmg set matchId = 1603656150 where matchId = 1603658480;

select createdAt, matchId, map from matchlog where matchId = 1603658480;
update matchlog set matchId = 1603656150 where matchId = 1603658480;

select createdAt, matchId, map from matchlog where matchId = 1603656150;
delete from matchlog where matchId = 1603656150 and map = 'c9m2_lots';

select * from transaction where comment like '%1603658480';

select matchId, round, map from round where matchId = 1603656150 and map = 'c14m1_junkyard';
select matchId, round, map from survivor where matchId = 1603656150 and map = 'c14m1_junkyard';
select matchId, round, map from infected where matchId = 1603656150 and map = 'c14m1_junkyard';
select matchId, round, map from pvp_ff where matchId = 1603656150 and map = 'c14m1_junkyard';
select matchId, round, map from pvp_infdmg where matchId = 1603656150 and map = 'c14m1_junkyard';
select matchId, round, map from round where matchId = 1603656150 and map = 'c14m2_lighthouse';
select matchId, round, map from survivor where matchId = 1603656150 and map = 'c14m2_lighthouse';
select matchId, round, map from infected where matchId = 1603656150 and map = 'c14m2_lighthouse';
select matchId, round, map from pvp_ff where matchId = 1603656150 and map = 'c14m2_lighthouse';
select matchId, round, map from pvp_infdmg where matchId = 1603656150 and map = 'c14m2_lighthouse';

update round set round = 3 where matchId = 1603656150 and map = 'c14m1_junkyard';
update survivor set round = 3 where matchId = 1603656150 and map = 'c14m1_junkyard';
update infected set round = 3 where matchId = 1603656150 and map = 'c14m1_junkyard';
update pvp_ff set round = 3 where matchId = 1603656150 and map = 'c14m1_junkyard';
update pvp_infdmg set round = 3 where matchId = 1603656150 and map = 'c14m1_junkyard';
update round set round = 4 where matchId = 1603656150 and map = 'c14m2_lighthouse';
update survivor set round = 4 where matchId = 1603656150 and map = 'c14m2_lighthouse';
update infected set round = 4 where matchId = 1603656150 and map = 'c14m2_lighthouse';
update pvp_ff set round = 4 where matchId = 1603656150 and map = 'c14m2_lighthouse';
update pvp_infdmg set round = 4 where matchId = 1603656150 and map = 'c14m2_lighthouse';