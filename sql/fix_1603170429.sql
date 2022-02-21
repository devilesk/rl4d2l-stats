select a.id, a.createdAt, a.matchId, a.round, a.map, b.campaign from round a join maps b on a.map = b.map where b.campaign = 'The Lighthouse' or b.campaign = 'Crash Course' or b.campaign = 'Crasht Stand';

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

delete from round where createdAt like '2020-10-20%';
delete from survivor where createdAt like '2020-10-20%';
delete from infected where createdAt like '2020-10-20%';
delete from pvp_ff where createdAt like '2020-10-20%';
delete from pvp_infdmg where createdAt like '2020-10-20%';
delete from matchlog where createdAt like '2020-10-20%';