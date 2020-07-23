const fs = require('fs-extra');
const { MessageEmbed } = require('discord.js');
const getTeamsData = require('../common/getTeamsData');
const execQuery = require('../common/execQuery');
const reduceStatsToRankings = require('../common/reduceStatsToRankings');
const config = require('./config');
const path = require('path');

const createTeamGeneratorEmbed = (results, steamIds, playerNames, latestLeagueMatchData, seasonal) => {
    const rankings = reduceStatsToRankings(steamIds, latestLeagueMatchData);
    const names = Object.values(playerNames).sort((a, b) => {
        if (a.startsWith('EMPTY') === b.startsWith('EMPTY')) return a.localeCompare(b);
        if (a.startsWith('EMPTY')) return 1;
        return -1;
    });
    const embed = new MessageEmbed()
        .setTitle('Team Generator')
        .setURL(encodeURI(`${config.strings.statsUrl}/#/teamgen/${names}`))
        .setDescription(Object.entries(rankings).sort((a, b) => b[1] - a[1]).map(([steamId, rating]) => `${playerNames[steamId]} ${rating}`).join(','))
        .setFooter(`!teams ${names} ${seasonal ? 'season' : 'all'}`)
        .setColor(0x972323);
    if (results.length < 5) return embed;
    for (let i = 0; i < 5; i++) {
        const result = results[i];
        const survivor = result.slice(0, 4);
        const infected = result.slice(7);
        const survivorRating = result[4];
        const ratingDiff = result[5];
        const infectedRating = result[6];
        const title = `Survivor (${survivorRating}) vs Infected (${infectedRating}) | ${ratingDiff}`;
        const content = `${survivor.join(',')} vs ${infected.join(',')}`;
        embed.addField(title, content, false);
    }
    return embed;
};

const getGeneratedTeams = async (dataDir, connection, discordIds, players, seasonal, writeTeamgen) => {
    let queryResult;
    if (discordIds) {
        queryResult = await execQuery(connection, `SELECT steamid, name FROM players WHERE discord IN (${',?'.repeat(discordIds.length).slice(1)})`, discordIds);
    }
    else if (players) {
        queryResult = await execQuery(connection, `SELECT steamid, name FROM players WHERE name IN (${',?'.repeat(players.length).slice(1)})`, players);
    }
    else {
        const teamgen = await fs.readJson(path.join(dataDir, 'teamgen.json'));
        queryResult = await execQuery(connection, `SELECT steamid, name FROM players WHERE name IN (${',?'.repeat(teamgen.players.length).slice(1)})`, teamgen.players);
    }
    const steamIds = queryResult.results.map(row => row.steamid);
    const playerNames = queryResult.results.reduce((acc, row) => {
        acc[row.steamid] = row.name;
        return acc;
    }, {});
    while (steamIds.length < 8) {
        const fakeId = `EMPTY${steamIds.length + 1}`;
        steamIds.push(fakeId);
        playerNames[fakeId] = fakeId;
    }
    if (writeTeamgen) await fs.writeJson(path.join(dataDir, 'teamgen.json'), { players: Object.values(playerNames) });
    const stats = await fs.readJson(path.join(dataDir, seasonal ? 'season.json' : 'league.json'));
    const teams = getTeamsData(steamIds, playerNames, stats).sort((a, b) => (a[5] - b[5]));
    return createTeamGeneratorEmbed(teams, steamIds, playerNames, stats, seasonal);
};

module.exports = getGeneratedTeams;
