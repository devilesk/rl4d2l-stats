const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');
const { BetManager, Constants } = require('../../betManager');
const { msgHasL4DMention, fetchMessageReactionUsers } = require('../../util');
const logger = require('../../../cli/logger');

class TopBankrollCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'topbankroll',
            aliases: ['richest', 'topbank', 'topfunds'],
            group: 'bet',
            memberName: 'topbankroll',
            description: 'Bankroll leaderboard.',
        });
    }

    async run(msg) {
        if (config.settings.betChannels.indexOf(msg.channel.name) === -1) return;
        let bankrolls = await BetManager.getActiveBankrolls();
        if (!bankrolls.length) {
            return msg.reply('No bankrolls.');
        }
        bankrolls = bankrolls.sort((a, b) => {
            if (a.amount > b.amount) return -1;
            if (a.amount < b.amount) return 1;
            return 0;
        });
        const embed = new MessageEmbed()
            .setTitle('Richest Players')
            .setColor(0x8c39ca);
        const data = [];
        let currAmount = -1;
        let currRank = 0;
        for (let i = 0; i < bankrolls.length; i++) {
            const { userId, amount } = bankrolls[i];
            if (amount !== currAmount) {
                currAmount = amount;
                currRank++;
            }
            const user = await this.client.users.fetch(userId);
            data.push(`${currRank}. ${user.username} ${amount}`);
        }
        embed.setDescription(data.join('\n'));
        msg.embed(embed);
    }
}

module.exports = TopBankrollCommand;
