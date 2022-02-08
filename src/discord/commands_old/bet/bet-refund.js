const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');
const { BetManager, Constants } = require('../../betManager');
const { msgHasL4DMention, fetchMessageReactionUsers } = require('../../util');
const msgFromAdmin = require('../../msgFromAdmin');
const logger = require('../../../cli/logger');

class BetRefundCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bet-refund',
            aliases: ['refund', 'refund-bet', 'wager-remove', 'remove-wager', 'wager-delete', 'delete-wager', 'cancel-wager', 'wager-cancel'],
            group: 'bet',
            memberName: 'bet-refund',
            description: 'Refund a wager.',
            argsPromptLimit: 0,
            args: [
                {
                    key: 'user',
                    prompt: 'User to refund',
                    type: 'user',
                },
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
    
    async run(msg, { user, betNumberOrName }) {
        if (config.settings.betChannels.indexOf(msg.channel.name) === -1) return;
        
        let bet = await BetManager.findBetByNumberOrName(betNumberOrName);
        if (!bet) {
            let choice;
            let error;
            ({ choice, bet, error } = await BetManager.findChoiceInBets(betNumberOrName));
            if (error === Constants.AMBIGUOUS_CHOICE) {
                return msg.reply('Found multiple matching choices. Give a bet number or name. `!betinfo <betNumberOrName>`');
            }
            else if (error === Constants.INVALID_CHOICE) {
                return msg.reply('Bet not found.');
            }
        }
        
        const result = await BetManager.removeWager(bet.name, user.id, true);
        switch (result) {
            case Constants.BET_NOT_FOUND:
                return msg.reply('Bet not found.');
            break;
            case Constants.WAGER_NOT_FOUND:
                return msg.reply(`${user.username} has no wager.`);
            break;
            case Constants.WAGER_REMOVED:
                return msg.reply(`Removed ${user.username}'s wager.`);
            break;
        }
    }
}

module.exports = BetRefundCommand;
