const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');
const { BetManager, Constants } = require('../../betManager');
const { msgHasL4DMention, fetchMessageReactionUsers } = require('../../util');
const msgFromAdmin = require('../../msgFromAdmin');
const logger = require('../../../cli/logger');

class BetTimerCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bet-timer',
            aliases: ['timer-bet'],
            group: 'bet',
            memberName: 'bet-timer',
            description: 'Set a lock date for a bet.',
            argsPromptLimit: 0,
            args: [
                {
                    key: 'betNumberOrName',
                    prompt: 'Bet number or name',
                    type: 'string',
                },
                {
                    key: 'lockDate',
                    prompt: 'Bet lock date',
                    type: 'string',
                    validate: (value) => {
                        if (isNaN(Date.parse(value))) return 'Invalid date format. MM-DD-YYYY HH:MM AM/PM EDT/EST/PDT/PST';
                        return true;
                    },
                },
            ],
        });
    }
    
    hasPermission(msg) {
        return msgFromAdmin(msg);
    }

    async run(msg, { betNumberOrName, lockDate }) {
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
        
        await BetManager.setBetLockTimestamp(bet.name, Date.parse(lockDate) / 1000);
        bet = await BetManager.getBet(bet.name);
        msg.say(`Lock date for bet ${bet.name} set to ${new Date(bet.lockTimestamp * 1000).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', timeZoneName: 'short'})}.`);
    }
}

module.exports = BetTimerCommand;
