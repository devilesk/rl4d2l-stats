const { Command } = require('discord.js-commando');
const config = require('../../config');

class ServerCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'server',
            aliases: ['servers'],
            group: 'league',
            memberName: 'server',
            description: 'Display link to servers.',
        });
    }
    
    async run(msg) {
        if (msg.channel.name === config.settings.inhouseChannel || config.settings.botChannels.indexOf(msg.channel.name) !== -1) {
            return msg.say(config.strings.server);
        }
    }
};

module.exports = ServerCommand;