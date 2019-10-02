const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');
const { BetManager, Constants } = require('../../betManager');
const { msgHasL4DMention, fetchMessageReactionUsers } = require('../../util');
const logger = require('../../../cli/logger');

class BetInfoCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bet-info',
            aliases: ['info-bet', 'status-bet', 'bet-status', 'bet-details', 'details-bet'],
            group: 'bet',
            memberName: 'bet-info',
            description: 'Bet info.',
            argsPromptLimit: 0,
            args: [
                {
                    key: 'betNumberOrName',
                    prompt: 'Bet number or name',
                    type: 'string',
                    default: '',
                },
            ],
        });
    }

    async run(msg, { betNumberOrName }) {
        if (config.settings.betChannels.indexOf(msg.channel.name) === -1) return;

        if (betNumberOrName === '') {
            const bets = await BetManager.getBets();
            return msg.reply(`Missing bet name. ${bets.map(bet => `\`!betinfo ${bet.name}\``).join(', ')}`);
        }
        
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
        const embed = await BetManager.getBetEmbed(this.client, bet.name);
        msg.embed(embed);
    }
}

module.exports = BetInfoCommand;
