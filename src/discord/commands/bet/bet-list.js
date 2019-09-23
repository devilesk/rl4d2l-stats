const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');
const { BetManager, Constants } = require('../../betManager');
const { msgHasL4DMention, fetchMessageReactionUsers } = require('../../util');
const logger = require('../../../cli/logger');

class BetListCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bet-list',
            aliases: ['list-bet'],
            group: 'bet',
            memberName: 'bet-list',
            description: 'List bets.',
        });
    }

    async run(msg, { name, choices }) {
        if (config.settings.botChannels.indexOf(msg.channel.name) === -1) return;
        if (!BetManager.bets.length) {
            return msg.reply('No bets.');
        }
        const embed = new RichEmbed()
            .setColor(0x8c39ca);
        for (let i = 0; i < BetManager.bets.length; i++) {
            const bet = BetManager.bets[i];
            let title = `**${i+1}. ${bet.name}**`;
            let description = `${bet.status === Constants.BET_OPEN ? 'Open' : 'Closed'}`;
            if (bet.status === Constants.BET_OPEN && bet.lockTimestamp && new Date() < bet.lockTimestamp) {
                description += ` until ${new Date(bet.lockTimestamp).toLocaleTimeString('en-US', {month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short'})}`
            }
            embed.addField(title, [description].concat(bet.choices.map((choice, index) => `${index+1}. ${choice}`)).join('\n'), true);
        }
        msg.embed(embed);
    }
}

module.exports = BetListCommand;
