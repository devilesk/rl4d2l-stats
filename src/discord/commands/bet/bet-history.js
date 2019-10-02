const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');
const { BetManager, Constants } = require('../../betManager');
const { msgHasL4DMention, fetchMessageReactionUsers } = require('../../util');
const logger = require('../../../cli/logger');

class BetHistoryCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bet-history',
            aliases: ['history-bet', 'bet-log', 'log-bet', 'history'],
            group: 'bet',
            memberName: 'bet-history',
            description: 'Bets history.',
        });
    }

    async run(msg) {
        if (config.settings.betChannels.indexOf(msg.channel.name) === -1) return;
        const history = await BetManager.getHistory(msg.author.id);
        if (!history.length) {
            return msg.reply('No history.');
        }
        const embed = new RichEmbed()
            .setTitle(`${msg.author.username}'s transaction history`)
            .setColor(0x8c39ca);
        let numWagers = 0;
        let totalWagered = 0;
        let profit = 0;
        for (const record of history) {
            if (record.comment === 'wager added') {
                numWagers++;
                totalWagered -= record.amount;
            }
            else if (record.comment === 'bet removed') {
                numWagers--;
                totalWagered -= record.amount;
            }
            else if (record.comment === 'wager removed') {
                numWagers--;
                totalWagered -= wager.amount;
            }
            else if (record.comment === 'bet won') {
                profit += record.amount / 2;
                embed.addField(`**${record.name} | ${record.winner} **`, `${record.choice} ${record.wagerAmount}`, true);
            }
            else if (record.comment === 'bet lost') {
                embed.addField(`**${record.name} | ${record.winner} **`, `${record.choice} ${-record.wagerAmount}`, true);
            }
        }
        const bankroll = await BetManager.getBankroll(msg.author.id);
        embed.setDescription(`Bankroll: $${bankroll}. ${numWagers} wager${numWagers === 1 ? '' : 's'} placed. Total: $${totalWagered}. Profit: $${profit}.`);
        msg.embed(embed);
    }
}

module.exports = BetHistoryCommand;
