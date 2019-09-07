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
            const inhouseMembers = msg.guild.members.filter(member => !member.user.bot && member.roles.find(role => role.name === config.settings.inhouseRole));
            const counts = {
                online_no_game: inhouseMembers.filter(member => member.presence.status === 'online' && !member.presence.game).size,
                online_in_game: inhouseMembers.filter(member => member.presence.status === 'online' && member.presence.game).size,
                idle: inhouseMembers.filter(member => member.presence.status === 'idle').size,
                offline: inhouseMembers.filter(member => member.presence.status === 'offline').size,
                dnd: inhouseMembers.filter(member => member.presence.status === 'dnd').size,
            }
            return msg.say(`${config.settings.inhouseRole} role | Online: ${counts.online_no_game} | In Game: ${counts.online_in_game} | Idle: ${counts.idle} | Do Not Disturb: ${counts.dnd}`);
        }
    }
}

module.exports = OnlineCommand;
