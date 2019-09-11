const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const config = require('../../config');
const { msgHasL4DMention } = require('../../util');

class TopPingers extends Command {
    constructor(client) {
        super(client, {
            name: 'toppingers',
            group: 'owner',
            memberName: 'toppingers',
            description: 'Top inhouse role pingers.',
        });
    }

    hasPermission(msg) {
        return this.client.isOwner(msg.author);
    }

    async run(msg) {
        if (config.settings.botChannels.indexOf(msg.channel.name) !== -1) {
            let results = {};
            let messages;
            let lastMessage;
            const channel = msg.guild.channels.find(channel => channel.name === config.settings.inhouseChannel);
            const reply = await msg.say('Processing...');
            let count = 0;
            do {
                messages = await channel.fetchMessages({
                    limit: 100,
                    before: lastMessage ? lastMessage.id : null,
                });
                lastMessage = messages.array()[messages.size - 1];
                for (const _msg of messages.array()) {
                    const message = await channel.fetchMessage(_msg.id);
                    if (msgHasL4DMention(message)) {
                        results[message.author.id] = results[message.author.id] || {
                            total: 0,
                            success: 0,
                            username: message.author.username,
                        };
                        results[message.author.id].total++;
                        for (const reaction of message.reactions.array()) {
                            if (reaction.emoji.name === '✅') {
                                const fetchedUsers = await reaction.fetchUsers();
                                if (fetchedUsers.has(this.client.user.id)) {
                                    results[message.author.id].success++;
                                    break;
                                }
                            }
                        }
                    }
                }
                count += messages.size;
                await reply.edit(`Processing... ${count}`);
            } while (messages.size);
            results = Object.values(results).sort((a, b) => (b.success / b.total) - (a.success / a.total));
            if (results.length) {
                const embed = new RichEmbed()
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
}

module.exports = TopPingers;
