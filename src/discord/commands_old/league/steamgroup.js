const { Command } = require('discord.js-commando');
const config = require('../../config');

class SteamGroupCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'steamgroup',
            group: 'league',
            memberName: 'steamgroup',
            description: 'Display link to steam group.',
        });
    }

    async run(msg) {
        if (msg.channel.name === config.settings.inhouseChannel || config.settings.botChannels.indexOf(msg.channel.name) !== -1) {
            return msg.say(config.strings.steamgroup);
        }
    }
}

module.exports = SteamGroupCommand;
