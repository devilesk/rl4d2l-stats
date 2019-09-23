const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');
const { BetManager, Constants } = require('../../betManager');
const { msgHasL4DMention, fetchMessageReactionUsers } = require('../../util');
const msgFromAdmin = require('../../msgFromAdmin');
const logger = require('../../../cli/logger');

class BetEndCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bet-end',
            aliases: ['bet-finish', 'end-bet', 'finish-bet', 'stop-bet', 'bet-stop'],
            group: 'bet',
            memberName: 'bet-end',
            description: 'End a bet.',
            args: [
                {
                    key: 'choiceNumberOrName',
                    prompt: 'Bet choice number or name',
                    type: 'string',
                },
                {
                    key: 'betNumberOrName',
                    prompt: 'Bet number or name',
                    type: 'string',
                    default: '',
                },
            ],
        });
    }
    
    hasPermission(msg) {
        return msgFromAdmin(msg);
    }

    async run(msg, { choiceNumberOrName, betNumberOrName }) {
        if (config.settings.botChannels.indexOf(msg.channel.name) === -1) return;
        
        let bet;
        if (betNumberOrName) {
            bet = BetManager.findBetByNumberOrName(betNumberOrName);
        }

        let choice;
        if (!isNaN(choiceNumberOrName)) {
            if (!betNumberOrName) {
                return msg.reply('Must give a bet number or name when referencing a choice by number. `!bet <amount> <choiceNumberOrName> [betNumberOrName]`');
            }
            if (bet) {
                const choiceIndex = parseInt(choiceNumberOrName) - 1;
                choice = bet.choices[choiceIndex];
            }
            else {
                return msg.reply('Bet not found.');
            }
        }
        else {
            if (bet) {
                choice = BetManager.findChoiceInBet(choiceNumberOrName, bet);
            }
            else {
                let error;
                ({ choice, bet, error } = BetManager.findChoiceInBets(choiceNumberOrName));
                if (error === Constants.AMBIGUOUS_CHOICE) {
                    return msg.reply('Found multiple matching choices. Give a bet number or name. `!bet <amount> <choiceNumberOrName> [betNumberOrName]`');
                }
                else if (error === Constants.INVALID_CHOICE) {
                    return msg.reply('Choice not found.');
                }
            }
        }

        if (!bet) {
            return msg.reply('Bet not found.');
        }
        if (!choice) {
            return msg.reply('Choice not found.');
        }
        
        const result = await BetManager.endBet(bet.name, choice);
        switch (result) {
            case Constants.BET_NOT_FOUND:
                return msg.reply('Bet not found.');
            break;
            case Constants.INVALID_CHOICE:
                return msg.reply('Choice not found.');
            break;
            default:
                const embed = new RichEmbed()
                    .setColor(0x8c39ca);
                const winners = [];
                for (const wager of result.winners) {
                    const user = await this.client.fetchUser(wager.userId);
                    winners.push(`${user.username} $${wager.amount}`);
                }
                embed.addField('Winners', winners.join('\n') || 'None', true);
                const losers = [];
                for (const wager of result.losers) {
                    const user = await this.client.fetchUser(wager.userId);
                    losers.push(`${user.username} -$${wager.amount}`);
                }
                embed.addField('Losers', losers.join('\n') || 'None', true);
                msg.channel.send(`Ended bet **${bet.name}** with **${choice}** winning.`, embed);
            break;
        }
    }
}

module.exports = BetEndCommand;
