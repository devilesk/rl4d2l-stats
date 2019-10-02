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
            argsPromptLimit: 0,
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
        
        await BetManager.removeBet(bet.name);
        msg.say(`Removed bet ${bet.name}.`);
    }
}

module.exports = BetRemoveCommand;
