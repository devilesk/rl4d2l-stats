const { Command } = require('discord.js-commando');
const config = require('../../config');

class OnlineCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'online',
            group: 'general',
            memberName: 'online',
            description: 'Display count of online users.',
        });
    }

    async run(msg) {
        if (msg.channel.name === config.settings.inhouseChannel || config.settings.botChannels.indexOf(msg.channel.name) !== -1) {
            const counts = {
                online_no_game: msg.guild.members.filter(member => !member.user.bot && member.presence.status === 'online' && !member.presence.game && member.roles.find(role => role.name === config.settings.inhouseRole)).size,
                online_in_game: msg.guild.members.filter(member => !member.user.bot && member.presence.status === 'online' && member.presence.game).size,
                idle: msg.guild.members.filter(member => !member.user.bot && member.presence.status === 'idle').size,
                offline: msg.guild.members.filter(member => !member.user.bot && member.presence.status === 'offline').size,
                dnd: msg.guild.members.filter(member => !member.user.bot && member.presence.status === 'dnd').size,
            }
            return msg.say(`Online (${config.settings.inhouseRole} role): ${counts.online_no_game}. In Game: ${counts.online_in_game}. Idle: ${counts.idle}. DND: ${counts.dnd}.`);
        }
    }
}

module.exports = OnlineCommand;
