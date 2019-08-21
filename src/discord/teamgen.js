const fs = require('fs-extra');
const { RichEmbed } = require('discord.js');
const getTeamsData = require('../common/getTeamsData');
const path = require('path');

const createTeamGeneratorEmbed = (results) => {
    const embed = new RichEmbed()
        .setTitle('Team Generator')
        .setColor(0x972323);
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

const getGeneratedTeams = async (dataDir, steamIds = []) => {
    const players = await fs.readJson(path.join(dataDir, 'players.json'));
    const teamgen = await fs.readJson(path.join(dataDir, 'teamgen.json'));
    const league = await fs.readJson(path.join(dataDir, 'league.json'));
    console.log('teamgen.json', teamgen);
    const playerNames = players.reduce((acc, row) => {
        acc[row.steamid] = row.name;
        return acc;
    }, {});
    if (steamIds.length < 8) {
        steamIds = teamgen.players.reduce((acc, name) => {
            const player = players.find((row) => row.name === name);
            if (player) acc.push(player.steamid);
            return acc;
        }, []);
    }
    console.log('steamIds', steamIds);
    const teams = getTeamsData(steamIds, playerNames, league).sort((a, b) => (a[5] - b[5]));
    console.log('teams', teams);
    return createTeamGeneratorEmbed(teams);
};

module.exports = getGeneratedTeams;
