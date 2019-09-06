const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const connection = require('../../connection');
const config = require('../../config');
const execQuery = require('../../../common/execQuery');
const formatDate = require('../../../common/formatDate');

const lastPlayedMapsQuery = `SELECT b.campaign as campaign, MAX(a.startedAt) as startedAt
FROM matchlog a
JOIN maps b
ON a.map = b.map
GROUP BY b.campaign
ORDER BY MAX(a.startedAt) DESC;`;

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
            const { results } = await execQuery(connection, lastPlayedMapsQuery);
            const embed = new RichEmbed()
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
