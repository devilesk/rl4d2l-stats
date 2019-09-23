const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');
const { BetManager, Constants } = require('../../betManager');
const { msgHasL4DMention, fetchMessageReactionUsers } = require('../../util');
const logger = require('../../../cli/logger');

class BetAddCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bet-add',
            aliases: ['bet-start', 'start-bet', 'add-bet'],
            group: 'bet',
            memberName: 'bet-add',
            description: 'Start a new bet.',
            args: [
                {
                    key: 'name',
                    prompt: 'Bet name',
                    type: 'string',
                },
                {
                    key: 'choices',
                    prompt: 'Bet choices',
                    type: 'string',
                    validate: (value) => {
                        if (value.indexOf(',') !== -1) return true;
                        return 'Choices must be separated by a comma.';
                    },
                },
                {
                    key: 'lockDate',
                    prompt: 'Bet lock date',
                    type: 'string',
                    default: '',
                    validate: (value) => {
                        if (value && isNaN(Date.parse(value))) return 'Invalid date format. MM-DD-YYYY HH:MM AM/PM EDT/EST/PDT/PST';
                        return true;
                    },
                },
            ],
        });
    }

    async run(msg, { name, choices, lockDate }) {
        if (config.settings.botChannels.indexOf(msg.channel.name) === -1) return;
        const result = await BetManager.addBet(name, choices.split(',').map(choice => choice.trim()), Date.parse(lockDate) || 0);
        if (result) {
            msg.say(`Added bet ${name}.`);
        }
        else {
            msg.say(`Bet named ${name} already exists.`);
        }
    }
}

module.exports = BetAddCommand;
