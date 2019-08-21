const fs = require('fs-extra');
const { RichEmbed } = require('discord.js');
const getTeamsData = require('../common/getTeamsData');
const execQuery = require('../common/execQuery');
const path = require('path');

const createTeamGeneratorEmbed = (results) => {
    const embed = new RichEmbed()
        .setTitle('Team Generator')
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

const getGeneratedTeams = async (dataDir, connection, discordIds) => {
    let queryResult;
    if (discordIds) {
        queryResult = await execQuery(connection, `SELECT steamid, name FROM players WHERE discord IN (${',?'.repeat(discordIds.length).slice(1)})`, discordIds);
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
    await fs.writeJson(path.join(dataDir, 'teamgen.json'), { players: Object.values(playerNames) });
    const league = await fs.readJson(path.join(dataDir, 'league.json'));
    const teams = getTeamsData(steamIds, playerNames, league).sort((a, b) => (a[5] - b[5]));
    return createTeamGeneratorEmbed(teams);
};

module.exports = getGeneratedTeams;
