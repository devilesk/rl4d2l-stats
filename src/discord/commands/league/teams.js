const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const getGeneratedTeams = require('../../teamgen');
const connection = require('../../connection');
const config = require('../../config');

class TeamsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'teams',
            aliases: ['team', 'teamgen', 'teamgenerator'],
            group: 'league',
            memberName: 'teams',
            description: 'Display top 5 closest team matchups from team generator.',
        });
    }
    
    async run(msg) {
        if (msg.channel.name === config.settings.inhouseChannel || config.settings.botChannels.indexOf(msg.channel.name) !== -1) {
            return msg.embed(await getGeneratedTeams(process.env.DATA_DIR, connection));
        }
    }
};

module.exports = TeamsCommand;