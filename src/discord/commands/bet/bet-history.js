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
            aliases: ['history-bet', 'bet-log', 'log-bet'],
            group: 'bet',
            memberName: 'bet-history',
            description: 'Bets history.',
        });
    }

    async run(msg) {
        if (config.settings.betChannels.indexOf(msg.channel.name) === -1) return;
        const history = [];
        for (const bet of BetManager.history) {
            for (const wager of bet.wagers) {
                if (wager.userId === msg.author.id) {
                    history.push({
                        amount: wager.amount,
                        name: bet.name,
                        choice: wager.choice,
                        winner: bet.winner,
                        createdTimestamp: wager.createdTimestamp,
                    });
                }
            }
        }
        if (!history.length) {
            return msg.reply('No bets.');
        }
        history.sort((a, b) => {
            if (a.createdTimestamp < b.createdTimestamp) return -1;
            if (a.createdTimestamp > b.createdTimestamp) return 1;
            return 0;
        });
        const embed = new RichEmbed()
            .setTitle(`${msg.author.username}'s bet history`)
            .setColor(0x8c39ca);
        let numWagers = 0;
        let totalWagered = 0;
        let profit = 0;
        for (const wager of history) {
            embed.addField(`**${wager.name} | ${wager.winner} **`, `${wager.choice} ${wager.choice ? wager.amount : -wager.amount}`, true);
            numWagers++;
            totalWagered += wager.amount;
            profit += wager.winner === wager.choice ? wager.amount : -wager.amount;
        }
        const bankroll = await BetManager.getBankroll(msg.author.id);
        embed.setDescription(`Bankroll: $${bankroll}. ${numWagers} wager${numWagers === 1 ? '' : 's'} placed. Total: $${totalWagered}. Profit: $${profit}.`);
        msg.embed(embed);
    }
}

module.exports = BetHistoryCommand;
