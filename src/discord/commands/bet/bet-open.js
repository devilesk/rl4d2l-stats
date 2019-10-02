const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');
const { BetManager, Constants } = require('../../betManager');
const { msgHasL4DMention, fetchMessageReactionUsers } = require('../../util');
const msgFromAdmin = require('../../msgFromAdmin');
const logger = require('../../../cli/logger');

class BetOpenCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bet-open',
            aliases: ['open-bet', 'unlock-bet', 'bet-unlock'],
            group: 'bet',
            memberName: 'bet-open',
            description: 'Open a bet to wagers.',
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
        
        await BetManager.openBet(bet.name);
        msg.say(`Opened bet ${bet.name}.`);
    }
}

module.exports = BetOpenCommand;
