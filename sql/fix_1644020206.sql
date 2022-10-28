select createdAt, map, matchId
from matchlog
where createdAt like '2022-02-04%' and map like 'c11m%' and createdAt > '2022-02-04 19:00:00' and matchId = 0 and createdAt < '2022-02-06 19:00:00';

select createdAt, map, matchId, rndStartTime
from round
where createdAt like '2022-02-04%' and map like 'c11m%' and createdAt > '2022-02-04 19:00:00' and matchId = 0 and createdAt < '2022-02-06 19:00:00';

select createdAt, map, matchId
FROM survivor
where createdAt like '2022-02-04%' and map like 'c11m%' and createdAt > '2022-02-04 19:00:00' and matchId = 0 and createdAt < '2022-02-06 19:00:00';

select createdAt, map, matchId
FROM infected
where createdAt like '2022-02-04%' and map like 'c11m%' and createdAt > '2022-02-04 19:00:00' and matchId = 0 and createdAt < '2022-02-06 19:00:00';

select createdAt, map, matchId
FROM pvp_ff
where createdAt like '2022-02-04%' and map like 'c11m%' and createdAt > '2022-02-04 19:00:00' and matchId = 0 and createdAt < '2022-02-06 19:00:00';

select createdAt, map, matchId
FROM pvp_infdmg
where createdAt like '2022-02-04%' and map like 'c11m%' and createdAt > '2022-02-04 19:00:00' and matchId = 0 and createdAt < '2022-02-06 19:00:00';

update matchlog
set matchId = 1644020206
where createdAt like '2022-02-04%' and map like 'c11m%' and createdAt > '2022-02-04 19:00:00' and matchId = 0 and createdAt < '2022-02-06 19:00:00';

update round
set matchId = 1644020206
where createdAt like '2022-02-04%' and map like 'c11m%' and createdAt > '2022-02-04 19:00:00' and matchId = 0 and createdAt < '2022-02-06 19:00:00';

update survivor
set matchId = 1644020206
where createdAt like '2022-02-04%' and map like 'c11m%' and createdAt > '2022-02-04 19:00:00' and matchId = 0 and createdAt < '2022-02-06 19:00:00';

update infected
set matchId = 1644020206
where createdAt like '2022-02-04%' and map like 'c11m%' and createdAt > '2022-02-04 19:00:00' and matchId = 0 and createdAt < '2022-02-06 19:00:00';

update pvp_ff
set matchId = 1644020206
where createdAt like '2022-02-04%' and map like 'c11m%' and createdAt > '2022-02-04 19:00:00' and matchId = 0 and createdAt < '2022-02-06 19:00:00';

update pvp_infdmg
set matchId = 1644020206
where createdAt like '2022-02-04%' and map like 'c11m%' and createdAt > '2022-02-04 19:00:00' and matchId = 0 and createdAt < '2022-02-06 19:00:00';

update matchlog
set startedAt = 1644020206
where matchId = 1644020206;