--STEAM_1:1:85931090 2021
--STEAM_1:1:158799973 2022
--survivor steamid
--team steamid_0, steamid_1, steamid_2, steamid_3
--matchlog steamid
--infected steamid
--pvp_infdmg steamid, victim
--pvp_ff steamid, victim

select createdAt, steamid from survivor where steamid = 'STEAM_1:1:85931090';
select createdAt, steamid_0 from team where steamid_0 = 'STEAM_1:1:85931090';
select createdAt, steamid_1 from team where steamid_1 = 'STEAM_1:1:85931090';
select createdAt, steamid_2 from team where steamid_2 = 'STEAM_1:1:85931090';
select createdAt, steamid_3 from team where steamid_3 = 'STEAM_1:1:85931090';
select createdAt, steamid from matchlog where steamid = 'STEAM_1:1:85931090';
select createdAt, steamid from infected where steamid = 'STEAM_1:1:85931090';
select createdAt, steamid from pvp_infdmg where steamid = 'STEAM_1:1:85931090';
select createdAt, steamid from pvp_ff where steamid = 'STEAM_1:1:85931090';
select createdAt, steamid from pvp_infdmg where victim = 'STEAM_1:1:85931090';
select createdAt, steamid from pvp_ff where victim = 'STEAM_1:1:85931090';

select createdAt, steamid from survivor where steamid = 'STEAM_1:1:158799973';
select createdAt, steamid_0 from team where steamid_0 = 'STEAM_1:1:158799973';
select createdAt, steamid_1 from team where steamid_1 = 'STEAM_1:1:158799973';
select createdAt, steamid_2 from team where steamid_2 = 'STEAM_1:1:158799973';
select createdAt, steamid_3 from team where steamid_3 = 'STEAM_1:1:158799973';
select createdAt, steamid from matchlog where steamid = 'STEAM_1:1:158799973';
select createdAt, steamid from infected where steamid = 'STEAM_1:1:158799973';
select createdAt, steamid from pvp_infdmg where steamid = 'STEAM_1:1:158799973';
select createdAt, steamid from pvp_ff where steamid = 'STEAM_1:1:158799973';
select createdAt, steamid from pvp_infdmg where victim = 'STEAM_1:1:158799973';
select createdAt, steamid from pvp_ff where victim = 'STEAM_1:1:158799973';

update survivor set steamid = 'STEAM_1:1:158799973' where steamid = 'STEAM_1:1:85931090';
update team set steamid_0 = 'STEAM_1:1:158799973' where steamid_0 = 'STEAM_1:1:85931090';
update team set steamid_1 = 'STEAM_1:1:158799973' where steamid_1 = 'STEAM_1:1:85931090';
update team set steamid_2 = 'STEAM_1:1:158799973' where steamid_2 = 'STEAM_1:1:85931090';
update team set steamid_3 = 'STEAM_1:1:158799973' where steamid_3 = 'STEAM_1:1:85931090';
update matchlog set steamid = 'STEAM_1:1:158799973' where steamid = 'STEAM_1:1:85931090';
update infected set steamid = 'STEAM_1:1:158799973' where steamid = 'STEAM_1:1:85931090';
update pvp_infdmg set steamid = 'STEAM_1:1:158799973' where steamid = 'STEAM_1:1:85931090';
update pvp_ff set steamid = 'STEAM_1:1:158799973' where steamid = 'STEAM_1:1:85931090';
update pvp_infdmg set victim = 'STEAM_1:1:158799973' where victim = 'STEAM_1:1:85931090';
update pvp_ff set victim = 'STEAM_1:1:158799973' where victim = 'STEAM_1:1:85931090';