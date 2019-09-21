const { Command } = require('discord.js-commando');
const config = require('../../config');

class CoahreCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'coahre',
            aliases: ['dodge'],
            group: 'general',
            memberName: 'coahre',
            description: 'Coahre dodge meme.',
        });
    }

    async run(msg) {
        if (msg.channel.name === config.settings.inhouseChannel || config.settings.botChannels.indexOf(msg.channel.name) !== -1) {
            return msg.channel.send({files: ['https://i.imgur.com/BjPMYFp.png']});
        }
    }
}

module.exports = CoahreCommand;
