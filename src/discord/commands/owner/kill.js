const { Command } = require('discord.js-commando');

class KillCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'kill',
            group: 'owner',
            memberName: 'kill',
            description: 'Kills the bot.',
        });
    }
    
    hasPermission(msg) {
        return this.client.isOwner(msg.author);
    }
    
    async run(msg) {
        await msg.say('Killing bot process...');
        process.exit(0);
    }
};

module.exports = KillCommand;