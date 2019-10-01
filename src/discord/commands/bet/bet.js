const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');
const { BetManager, Constants } = require('../../betManager');
const { msgHasL4DMention, fetchMessageReactionUsers } = require('../../util');
const logger = require('../../../cli/logger');

class BetCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bet',
            aliases: ['wager', 'bid'],
            group: 'bet',
            memberName: 'bet',
            description: 'Place a wager on a bet.',
            argsPromptLimit: 0,
            args: [
                {
                    key: 'amount',
                    prompt: 'Wager amount',
                    type: 'string',
                },
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

    async run(msg, { amount, choiceNumberOrName, betNumberOrName }) {
        if (config.settings.betChannels.indexOf(msg.channel.name) === -1) return;
        
        if (isNaN(parseInt(amount))) {
             if (!isNaN(parseInt(choiceNumberOrName))) {
                 [amount, choiceNumberOrName] = [choiceNumberOrName, amount];
             }
             else {
                 return msg.reply('Amount must be greater than or equal to zero. `!bet <amount> <choiceNumberOrName> [betNumberOrName]`');
             }
        }
        
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
                    return msg.reply(`Found multiple choices matching ${choiceNumberOrName}. Give a bet number or name. \`!bet <amount> <choiceNumberOrName> [betNumberOrName]\``);
                }
                else if (error === Constants.INVALID_CHOICE) {
                    return msg.reply(`Choice ${choiceNumberOrName} not found.`);
                }
            }
        }

        if (!bet) {
            return msg.reply('Bet not found.');
        }
        if (!choice) {
            return msg.reply('Choice not found.');
        }
        
        let result;
        if (amount > 0) {
            if (!choice) {
                return msg.reply('Missing choice. `!bet <amount> <choiceNumberOrName> [betNumberOrName]`');
            }
            result = await BetManager.addWager(bet.name, msg.author.id, choice, amount);
        }
        else {
            result = await BetManager.removeWager(bet.name, msg.author.id);
        }
        switch (result) {
            case Constants.BET_NOT_FOUND:
                return msg.reply('Bet not found.');
            break;
            case Constants.BET_IS_CLOSED:
                return msg.reply('Bet is closed.');
            break;
            case Constants.INVALID_CHOICE:
                return msg.reply('Choice not found.');
            break;
            case Constants.INSUFFICIENT_FUNDS:
                return msg.reply('Insufficient funds.');
            break;
            case Constants.WAGER_UPDATED:
                return msg.reply('Wager updated.');
            break;
            case Constants.WAGER_ADDED:
                return msg.reply('Wager added.');
            break;
            case Constants.WAGER_NOT_FOUND:
                return msg.reply('Wager not found.');
            break;
            case Constants.WAGER_REMOVED:
                return msg.reply('Wager removed.');
            break;
        }
    }
}

module.exports = BetCommand;
