const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../config');
const { msgHasL4DMention, fetchMessageReactionUsers } = require('../../util');
const logger = require('../../../cli/logger');

class TopPingersCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'toppingers',
            group: 'league',
            memberName: 'toppingers',
            description: 'Top inhouse role pingers.',
        });
    }

    async run(msg) {
        if (config.settings.botChannels.indexOf(msg.channel.name) === -1) return;
        
        const filepath = path.join(__dirname, '../../toppingersData.json');
        const exists = await fs.pathExists(filepath);
        let data = {};
        let results = {};
        let stopTimestamp = 0;
        if (exists) {
            logger.info('toppingers loading data file...');
            data = await fs.readJson(filepath);
            results = data.results;
            stopTimestamp = data.stopTimestamp;
        }
        else {
            logger.info('toppingers data file not exists...');
        }
        
        let messages;
        let lastMessage;
        let startTimestamp;
        const channel = msg.guild.channels.cache.find(channel => channel.name === config.settings.inhouseChannel);
        const reply = await msg.say('Processing...');
        let count = 0;
        do {
            messages = await channel.messages.fetch({
                limit: 100,
                before: lastMessage ? lastMessage.id : null,
            });
            lastMessage = messages.array()[messages.size - 1];
            if (!startTimestamp) startTimestamp = messages.array()[0].createdTimestamp;
            
            let processed = 0;
            for (const _msg of messages.array()) {
                if (_msg.createdTimestamp <= stopTimestamp) {
                    lastMessage = _msg;
                    logger.info(`toppingers stopTimestamp ${stopTimestamp} reached...`);
                    break;
                }
                const message = await channel.messages.fetch(_msg.id);
                if (msgHasL4DMention(message)) {
                    results[message.author.id] = results[message.author.id] || {
                        total: 0,
                        success: 0,
                        username: message.author.username,
                    };
                    results[message.author.id].total++;
                    
                    // if topPingersFirstBotCheckmark in settings, then look for checkmark react from bot to determine successful pingers
                    // else look for 8 player reacts
                    if (config.settings.topPingersFirstBotCheckmark && message.createdTimestamp >= config.settings.topPingersFirstBotCheckmark) {
                        for (const reaction of message.reactions.cache.array()) {
                            if (reaction.emoji.name === '✅') {
                                const fetchedUsers = await reaction.users.fetch();
                                if (fetchedUsers.has(this.client.user.id)) {
                                    results[message.author.id].success++;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        const users = await fetchMessageReactionUsers(message);
                        if (users.filter(user => user.id !== this.client.user.id).size >= 8) {
                            results[message.author.id].success++;
                        }
                    }
                }
                processed++;
            }
            count += processed;
            await reply.edit(`Processing... ${count}`);
        } while (messages.size && lastMessage.createdTimestamp > stopTimestamp);
        await fs.writeJson(filepath, { results, stopTimestamp: startTimestamp });
        logger.info(`toppingers finished processing messages.`);
        
        results = Object.values(results).sort((a, b) => (b.success / b.total) - (a.success / a.total));
        if (results.length) {
            const embed = new MessageEmbed()
                .setTitle(`**Top ${config.settings.inhouseRole} Pingers**`)
                .setColor(0x972323);
            const title = `Name | Total | Success | %`;
            const content = results.map(result => `${result.username} | ${result.total} | ${result.success} | ${+(result.success / result.total).toFixed(2)}`).join('\n');
            embed.addField(title, content, false);
            reply.edit(embed);
        }
        else {
            reply.edit(`No ${config.settings.inhouseRole} pings found.`);
        }
    }
}

module.exports = TopPingersCommand;
