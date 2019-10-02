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
                {
                    key: 'comment',
                    prompt: 'Comment',
                    type: 'string',
                    default: '',
                },
            ],
        });
    }

    hasPermission(msg) {
        return msgFromAdmin(msg);
    }
    
    async run(msg, { amount, user, comment }) {
        if (config.settings.betChannels.indexOf(msg.channel.name) === -1) return;

        if (user) {
            const result = await BetManager.give(amount, user.id, comment);
            return msg.reply(`Added $${amount} to ${user.username}'s bankroll.`);
        }
        else {
            const bankrolls = await BetManager.getBankrolls();
            for (const userId of bankrolls.map(bankroll => bankroll.userId)) {
                const result = await BetManager.give(amount, userId, comment);
            }
            return msg.reply(`Added $${amount} to everyone's bankroll.`);
        }
    }
}

module.exports = BankrollAddCommand;
