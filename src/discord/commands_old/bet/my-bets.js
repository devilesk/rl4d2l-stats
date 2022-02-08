const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');
const { BetManager, Constants } = require('../../betManager');
const { msgHasL4DMention, fetchMessageReactionUsers } = require('../../util');
const logger = require('../../../cli/logger');

class MyBetsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'my-bets',
            aliases: ['bets', 'my-wagers', 'wagers', 'bids'],
            group: 'bet',
            memberName: 'my-bets',
            description: 'Your bets info.',
        });
    }

    async run(msg) {
        if (config.settings.betChannels.indexOf(msg.channel.name) === -1) return;
        const embed = new MessageEmbed()
            .setTitle(`${msg.author.username}'s bets`)
            .setColor(0x8c39ca);
        let numWagers = 0;
        let totalWagered = 0;
        const bets = await BetManager.getBets();
        for (let i = 0; i < bets.length; i++) {
            const bet = bets[i];
            const wagers = await BetManager.getBetWagers(bet.id);
            const wager = wagers.find(wager => wager.userId === msg.author.id);
            if (wager) {
                embed.addField(`**${bet.id}. ${bet.name} **`, `${wager.choice} $${wager.amount}`, true);
                numWagers++;
                totalWagered += wager.amount;
            }
        }
        const bankroll = await BetManager.getBankroll(msg.author.id);
        embed.setDescription(`Bankroll: $${bankroll}. ${numWagers} wager${numWagers === 1 ? '' : 's'} placed. Total: $${totalWagered}`);
        msg.embed(embed);
    }
}

module.exports = MyBetsCommand;
