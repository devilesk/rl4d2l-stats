const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const config = require('../../config');

class CustomCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'custom',
            aliases: ['customs', 'customcampaign', 'customcampaigns', 'custom-map', 'custom-maps'],
            group: 'league',
            memberName: 'custom',
            description: 'Custom campaign download links and installation instructions.',
        });
    }

    async run(msg) {
        if (msg.channel.name === config.settings.inhouseChannel || config.settings.botChannels.indexOf(msg.channel.name) !== -1) {
            const embed = new MessageEmbed()
                .setTitle(config.strings.customcampaigns.title)
                .setDescription(config.strings.customcampaigns.description)
                .setColor(0xa10e90);
            for (const entry of config.strings.customcampaigns.fields) {
                embed.addField(entry[0], entry[1], false);
            }
            return msg.embed(embed);
        }
    }
}

module.exports = CustomCommand;
