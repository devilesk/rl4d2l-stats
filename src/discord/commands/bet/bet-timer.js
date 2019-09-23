const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
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
        if (config.settings.botChannels.indexOf(msg.channel.name) === -1) return;
        let bet = BetManager.findBetByNumberOrName(betNumberOrName);
        if (!bet) {
            return msg.reply('Bet not found.');
        }
        bet = await BetManager.setBetLockTimestamp(bet.name, Date.parse(lockDate));
        msg.say(`Lock date for bet ${bet.name} set to ${new Date(bet.lockTimestamp).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', timeZoneName: 'short'})}.`);
    }
}

module.exports = BetTimerCommand;
