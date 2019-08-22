const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const connection = require('../../connection');
const config = require('../../config');
const execQuery = require('../../../common/execQuery');
const topStats = require('../../topStats');

class TopCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'top',
            group: 'league',
            memberName: 'top',
            description: 'Display top players for various stats.',
        });
    }
    
    async run(msg) {
        if (config.settings.botChannels.indexOf(msg.channel.name) !== -1) {
            const embed = new RichEmbed()
                .setTitle('Top stats (Need to play 20 or more rounds)')
                .setColor(0x000dff);

            for (const topStat of topStats) {
                const { results } = await execQuery(connection, topStat.query);
                const str = results.map(topStat.format).join('\n');
                embed.addField(topStat.title, str, true);
            }
            
            return msg.embed(embed);
        }
    }
};

module.exports = TopCommand;