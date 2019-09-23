const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');
const { BetManager, Constants } = require('../../betManager');
const { msgHasL4DMention, fetchMessageReactionUsers } = require('../../util');
const logger = require('../../../cli/logger');

class BetOpenCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bet-open',
            aliases: ['open-bet', 'unlock-bet', 'bet-unlock'],
            group: 'bet',
            memberName: 'bet-open',
            description: 'Open a bet to wagers.',
            args: [
                {
                    key: 'betNumberOrName',
                    prompt: 'Bet number or name',
                    type: 'string',
                },
            ],
        });
    }

    async run(msg, { betNumberOrName }) {
        if (config.settings.botChannels.indexOf(msg.channel.name) === -1) return;
        const bet = BetManager.findBetByNumberOrName(betNumberOrName);
        if (!bet) {
            return msg.reply('Bet not found.');
        }
        await BetManager.openBet(bet.name);
        msg.say(`Opened bet ${bet.name}.`);
    }
}

module.exports = BetOpenCommand;
