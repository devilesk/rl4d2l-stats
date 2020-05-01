const { Command } = require('discord.js-commando');
const config = require('../../config');
const { msgFromRole } = require('../../util');

class L4DCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'l4d',
            group: 'general',
            memberName: 'l4d',
            description: 'Start a L4D game ping.',
        });

        this.schedule = config.settings.pingSchedule;
    }

    async run(msg) {
        if (msg.channel.name !== config.settings.inhouseChannel) return;
        if (!msgFromRole(msg, config.settings.inhouseBlacklistRole)) {
            const now = new Date();
            const day = now.getUTCDay();
            const hours = now.getUTCHours();

            if (hours >= this.schedule[day][0] && hours < this.schedule[day][1]) {
                return;
            }

            const role = msg.guild.roles.find(role => role.name === config.settings.inhouseRole);
            msg.channel.send(`${role}`);
        }
    }
}

module.exports = L4DCommand;
