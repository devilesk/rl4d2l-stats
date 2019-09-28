const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');
const { BetManager, Constants } = require('../../betManager');
const { msgHasL4DMention, fetchMessageReactionUsers } = require('../../util');
const msgFromAdmin = require('../../msgFromAdmin');
const logger = require('../../../cli/logger');

class BetCloseCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bet-close',
            aliases: ['close-bet', 'lock-bet', 'bet-lock'],
            group: 'bet',
            memberName: 'bet-close',
            description: 'Close a bet to lock in wagers.',
            argsPromptLimit: 0,
            args: [
                {
                    key: 'name',
                    prompt: 'Bet name',
                    type: 'string',
                    validate: (value) => {
                        if (BetManager.getBet(value)) return true;
                        return 'Bet not found.';
                    },
                },
            ],
        });
    }
    
    hasPermission(msg) {
        return msgFromAdmin(msg);
    }

    async run(msg, { name }) {
        if (config.settings.botChannels.indexOf(msg.channel.name) === -1) return;
        await BetManager.closeBet(name);
        msg.say(`Closed bet ${name}.`);
    }
}

module.exports = BetCloseCommand;
