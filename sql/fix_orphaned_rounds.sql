select a.id, a.matchId, a.round, a.map, b.campaign from round a join maps b on a.map = b.map where b.campaign = 'The Passifice' or b.campaign = 'The Passing' or b.campaign = 'The Sacrifice';

select a.id, a.createdAt, a.matchId, a.round, a.map, b.campaign from round a join maps b on a.map = b.map where b.campaign = 'The Lighthouse' or b.campaign = 'Crash Course' or b.campaign = 'Crasht Stand';

select a.matchId, GROUP_CONCAT(a.round), GROUP_CONCAT(a.map) from round a join maps b on a.map = b.map where b.campaign = 'The Passifice' or b.campaign = 'The Passing' or b.campaign = 'The Sacrifice' GROUP BY a.matchId;

select id, createdAt, matchId, round, map from round where createdAt like '2020-10-20%';
select id, createdAt, matchId, round, map from survivor where createdAt like '2020-10-20%';
select id, createdAt, matchId, round, map from infected where createdAt like '2020-10-20%';
select id, createdAt, matchId, round, map from pvp_ff where createdAt like '2020-10-20%';
select id, createdAt, matchId, round, map from pvp_infdmg where createdAt like '2020-10-20%';
select id, matchId, map from matchlog where createdAt like '2020-10-20%';

select id, createdAt, matchId, round, map from round where matchId = 1603170429;
select id, createdAt, matchId, round, map from survivor where matchId = 1603170429;
select id, createdAt, matchId, round, map from infected where matchId = 1603170429;
select id, createdAt, matchId, round, map from pvp_ff where matchId = 1603170429;
select id, createdAt, matchId, round, map from pvp_infdmg where matchId = 1603170429;
select id, matchId, map from matchlog where matchId = 1603170429;

select id, createdAt, round, matchId from round where createdAt LIKE '2019-11-26 00:55%';
select id, createdAt, round, matchId from survivor where createdAt LIKE '2019-11-26 00:55%';
select id, createdAt, round, matchId from infected where createdAt LIKE '2019-11-26 00:55%';
select id, createdAt, round, matchId from pvp_ff where createdAt LIKE '2019-11-26 00:55%';
select id, createdAt, round, matchId from pvp_infdmg where createdAt LIKE '2019-11-26 00:55%';

select id, createdAt, round, map, matchId from round where matchId = 0;

select id, createdAt, round, map, matchId from round where createdAt like '2020-01-25 00:%';
select id, createdAt, round, map, matchId from survivor where createdAt like '2020-01-25 00:%';
select id, createdAt, round, map, matchId from infected where createdAt like '2020-01-25 00:%';
select id, createdAt, round, map, matchId from pvp_ff where createdAt like '2020-01-25 00:%';
select id, createdAt, round, map, matchId from pvp_infdmg where createdAt like '2020-01-25 00:%';

select id, createdAt, round, map, matchId from round where createdAt like '2021-04-19 00:14%';
select id, createdAt, round, map, matchId from survivor where createdAt like '2021-04-19 00:14%';
select id, createdAt, round, map, matchId from infected where createdAt like '2021-04-19 00:14%';
select id, createdAt, round, map, matchId from pvp_ff where createdAt like '2021-04-19 00:14%';
select id, createdAt, round, map, matchId from pvp_infdmg where createdAt like '2021-04-19 00:14%';



select id, createdAt, round, map, matchId from round where createdAt like '2022-02-04 15:%';
select id, createdAt, round, map, matchId, steamid from survivor where createdAt like '2022-02-04 15:%';
select id, createdAt, round, map, matchId, steamid from infected where createdAt like '2022-02-04 15:%';
select id, createdAt, round, map, matchId from pvp_ff where createdAt like '2022-02-04 15:%';
select id, createdAt, round, map, matchId from pvp_infdmg where createdAt like '2022-02-04 15:%';

delete from round where createdAt like '2022-02-04 15:%';
delete from survivor where createdAt like '2022-02-04 15:%';
delete from infected where createdAt like '2022-02-04 15:%';
delete from pvp_ff where createdAt like '2022-02-04 15:%';
delete from pvp_infdmg where createdAt like '2022-02-04 15:%';


select id, createdAt, round, map, matchId from round where createdAt like '2022-02-05%';
select id, createdAt, round, map, matchId, steamid from survivor where createdAt like '2022-02-05%';
select id, createdAt, round, map, matchId, steamid from infected where createdAt like '2022-02-05%';
select id, createdAt, round, map, matchId from pvp_ff where createdAt like '2022-02-05%';
select id, createdAt, round, map, matchId from pvp_infdmg where createdAt like '2022-02-05%';

select id, createdAt, round, map, matchId from round where createdAt > '2022-02-05 17:00:34' and createdAt < '2022-02-06 14:00:20';
select id, createdAt, round, steamid, matchId from survivor where createdAt > '2022-02-05 17:00:34' and createdAt < '2022-02-06 14:00:20';
select id, createdAt, round, steamid, matchId from infected where createdAt > '2022-02-05 17:00:34' and createdAt < '2022-02-06 14:00:20';
select id, createdAt, round, matchId from pvp_ff where createdAt > '2022-02-05 17:00:34' and createdAt < '2022-02-06 14:00:20';
select id, createdAt, round, matchId from pvp_infdmg where createdAt > '2022-02-05 17:00:34' and createdAt < '2022-02-06 14:00:20';

delete from round where createdAt > '2022-02-05 17:00:34' and createdAt < '2022-02-06 14:00:20';
delete from survivor where createdAt > '2022-02-05 17:00:34' and createdAt < '2022-02-06 14:00:20';
delete from infected where createdAt > '2022-02-05 17:00:34' and createdAt < '2022-02-06 14:00:20';
delete from pvp_ff where createdAt > '2022-02-05 17:00:34' and createdAt < '2022-02-06 14:00:20';
delete from pvp_infdmg where createdAt > '2022-02-05 17:00:34' and createdAt < '2022-02-06 14:00:20';