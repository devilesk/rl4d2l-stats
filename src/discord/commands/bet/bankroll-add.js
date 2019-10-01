const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');
const { BetManager, Constants } = require('../../betManager');
const { msgHasL4DMention, fetchMessageReactionUsers } = require('../../util');
const msgFromAdmin = require('../../msgFromAdmin');
const logger = require('../../../cli/logger');

class BankrollAddCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bankroll-add',
            aliases: ['add-bankroll'],
            group: 'bet',
            memberName: 'bankroll-add',
            description: 'Add an amount to a bankroll.',
            argsPromptLimit: 0,
            args: [
                {
                    key: 'amount',
                    prompt: 'Wager amount',
                    type: 'integer',
                },
                {
                    key: 'user',
                    prompt: 'User to refund',
                    type: 'user',
                    default: '',
                },
            ],
        });
    }

    hasPermission(msg) {
        return msgFromAdmin(msg);
    }
    
    async run(msg, { amount, user }) {
        if (config.settings.betChannels.indexOf(msg.channel.name) === -1) return;

        if (user) {
            const result = await BetManager.give(amount, user.id);
            return msg.reply(`Added $${amount} to ${user.username}'s bankroll.`);
        }
        else {
            for (const userId of Object.keys(BetManager.bankroll)) {
                const result = await BetManager.give(amount, userId);
            }
            return msg.reply(`Added $${amount} to everyone's bankroll.`);
        }
    }
}

module.exports = BankrollAddCommand;
