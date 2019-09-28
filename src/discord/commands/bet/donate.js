const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');
const { BetManager, Constants } = require('../../betManager');
const { msgHasL4DMention, fetchMessageReactionUsers } = require('../../util');
const logger = require('../../../cli/logger');

class BankrollCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'donate',
            aliases: ['give', 'transfer'],
            group: 'bet',
            memberName: 'donate',
            description: 'Give money to someone else.',
            argsPromptLimit: 0,
            args: [
                {
                    key: 'amount',
                    prompt: 'Donation amount',
                    type: 'integer',
                    validate: (value) => {
                        if (value > 0) return true;
                        return 'Amount must be greater than zero.';
                    },
                },
                {
                    key: 'user',
                    prompt: 'User to donate to',
                    type: 'user',
                },
            ],
        });
    }

    async run(msg, { amount, user }) {
        if (msg.channel.name !== config.settings.inhouseChannel && config.settings.botChannels.indexOf(msg.channel.name) === -1) return;
        const result = await BetManager.transfer(msg.author.id, amount, user.id);
        if (result === Constants.SUCCESS) {
            msg.reply(`You donated $${amount} to ${user.username}.`);
        }
        else if (result === Constants.INSUFFICIENT_FUNDS) {
            msg.reply(`Insufficient funds.`);
        }
    }
}

module.exports = BankrollCommand;
