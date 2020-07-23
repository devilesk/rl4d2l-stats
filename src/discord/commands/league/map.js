const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const connection = require('../../connection');
const config = require('../../config');
const lastPlayedMapsQuery = require('../../lastPlayedMapsQuery');
const execQuery = require('../../../common/execQuery');
const formatDate = require('../../../common/formatDate');

class MapCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'map',
            aliases: ['maps'],
            group: 'league',
            memberName: 'map',
            description: 'Display maps with last played date.',
        });
    }

    async run(msg) {
        if (msg.channel.name === config.settings.inhouseChannel || config.settings.botChannels.indexOf(msg.channel.name) !== -1) {
            const { results } = await execQuery(connection, lastPlayedMapsQuery(config.settings.ignoredCampaigns));
            const embed = new MessageEmbed()
                .setTitle('Maps')
                .setColor(0x20F622);
            const title = 'Last Played Date | Map';
            const content = results.map(row => `\`${formatDate(new Date(row.startedAt * 1000)).slice(0, -6).padEnd(10, ' ')} | ${row.campaign}\``).join('\n');
            embed.addField(title, content, false);
            return msg.embed(embed);
        }
    }
}

module.exports = MapCommand;
