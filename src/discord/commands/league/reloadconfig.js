const { Command } = require('discord.js-commando');
const config = require('../../config');

class ReloadConfigCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'reloadconfig',
            group: 'league',
            memberName: 'reloadconfig',
            description: 'Reload bot config.',
        });
    }
    
    hasPermission(msg) {
        return this.client.isOwner(msg.author);
    }
    
    async run(msg) {
        await config.load();
        return msg.say('Bot config reloaded!');
    }
};

module.exports = ReloadConfigCommand;