const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');
const { BetManager, Constants } = require('../../betManager');
const { msgHasL4DMention, fetchMessageReactionUsers } = require('../../util');
const msgFromAdmin = require('../../msgFromAdmin');
const logger = require('../../../cli/logger');

class BetRemoveCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bet-remove',
            aliases: ['remove-bet', 'bet-delete', 'delete-bet', 'cancel-bet', 'bet-cancel'],
            group: 'bet',
            memberName: 'bet-remove',
            description: 'Remove a bet.',
            args: [
                {
                    key: 'betNumberOrName',
                    prompt: 'Bet number or name',
                    type: 'string',
                },
            ],
        });
    }

    hasPermission(msg) {
        return msgFromAdmin(msg);
    }
    
    async run(msg, { betNumberOrName }) {
        if (config.settings.botChannels.indexOf(msg.channel.name) === -1) return;
        const bet = BetManager.findBetByNumberOrName(betNumberOrName);
        if (!bet) {
            return msg.reply('Bet not found.');
        }
        await BetManager.removeBet(bet.name);
        msg.say(`Removed bet ${bet.name}.`);
    }
}

module.exports = BetRemoveCommand;
