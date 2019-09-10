const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const config = require('../../config');

class TestCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'test',
            group: 'owner',
            memberName: 'test',
            description: 'Test the bot.',
        });
    }

    hasPermission(msg) {
        return this.client.isOwner(msg.author);
    }

    async run(msg) {
        const embed = new RichEmbed()
            .setTitle('Team Generator')
            .setURL(encodeURI(`${config.strings.statsUrl}/#/teamgen/devilesk,Gofu,Matieu,Osis,Roragok,SPACEDUDE,Wicket,Need a Hug?`))
            .setColor(0x972323);
        console.log(embed);
        await msg.embed(embed);
    }
}

module.exports = TestCommand;
