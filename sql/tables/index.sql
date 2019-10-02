SOURCE sql/tables/round.sql;
SOURCE sql/tables/survivor.sql;
SOURCE sql/tables/infected.sql;
SOURCE sql/tables/matchlog.sql;
SOURCE sql/tables/players.sql;
SOURCE sql/tables/maps.sql;
SOURCE sql/tables/pvp_ff.sql;
SOURCE sql/tables/pvp_infdmg.sql;
SOURCE sql/tables/season.sql;
SOURCE sql/tables/team.sql;
SOURCE sql/tables/leaguematchlog.sql;
SOURCE sql/tables/bet.sql;
SOURCE sql/tables/transaction.sql;
SOURCE sql/tables/wager.sql;
SOURCE sql/tables/bankroll.sql;

CREATE INDEX ix_infected_matchId ON infected(matchId);
CREATE INDEX ix_infected_round ON infected(round);
CREATE INDEX ix_infected_steamid ON infected(steamid);
CREATE INDEX ix_infected_deleted ON infected(deleted);
CREATE INDEX ix_infected_isSecondHalf ON infected(isSecondHalf);
CREATE INDEX ix_infected_multi ON infected(matchId,round,isSecondHalf);

CREATE INDEX ix_survivor_matchId ON survivor(matchId);
CREATE INDEX ix_survivor_round ON survivor(round);
CREATE INDEX ix_survivor_steamid ON survivor(steamid);
CREATE INDEX ix_survivor_deleted ON survivor(deleted);
CREATE INDEX ix_survivor_isSecondHalf ON survivor(isSecondHalf);
CREATE INDEX ix_survivor_multi ON survivor(matchId,round,isSecondHalf);

CREATE INDEX ix_matchlog_matchId ON matchlog(matchId);
CREATE INDEX ix_matchlog_deleted ON matchlog(deleted);
CREATE INDEX ix_matchlog_steamid ON matchlog(steamid);

CREATE INDEX ix_players_matchId ON players(name);
CREATE INDEX ix_players_steamid ON players(steamid);

CREATE INDEX ix_round_matchId ON round(matchId);
CREATE INDEX ix_round_round ON round(round);
CREATE INDEX ix_round_deleted ON round(deleted);
CREATE INDEX ix_round_isSecondHalf ON round(isSecondHalf);

CREATE INDEX ix_pvp_ff_matchId ON pvp_ff(matchId);
CREATE INDEX ix_pvp_ff_round ON pvp_ff(round);
CREATE INDEX ix_pvp_ff_steamid ON pvp_ff(steamid);
CREATE INDEX ix_pvp_ff_victim ON pvp_ff(victim);

CREATE INDEX ix_pvp_infdmg_matchId ON pvp_infdmg(matchId);
CREATE INDEX ix_pvp_infdmg_round ON pvp_infdmg(round);
CREATE INDEX ix_pvp_infdmg_steamid ON pvp_infdmg(steamid);
CREATE INDEX ix_pvp_infdmg_victim ON pvp_infdmg(victim);