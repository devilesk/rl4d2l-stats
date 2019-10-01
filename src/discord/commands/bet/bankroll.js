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
            name: 'bankroll',
            aliases: ['bank', 'funds', 'money', 'balance'],
            group: 'bet',
            memberName: 'bankroll',
            description: 'Show your total money.',
        });
    }

    async run(msg) {
        if (config.settings.betChannels.indexOf(msg.channel.name) === -1) return;
        const bankroll = await BetManager.getBankroll(msg.author.id);
        msg.reply(`You have $${bankroll}.`);
    }
}

module.exports = BankrollCommand;
