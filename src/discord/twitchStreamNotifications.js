const { MessageEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config');
const logger = require('../cli/logger');

const streamChannelIds = ['941729646372851792', '941726234151383061']
const streamChannels = [];
const streamChannelId = '553750343981334538';
let streamChannel;

class TwitchStreamNotifications {
    constructor() {
    }
    
    async init(client) {
        const guilds = await client.guilds.fetch();
        for (const [guildId, partialGuild] of guilds) {
            const guild = await client.guilds.fetch(guildId);
            const channels = await guild.channels.fetch();
            for (const [channelId, channel] of channels) {
                if (streamChannelIds.indexOf(channelId) !== -1) {
                    streamChannels.push(channel);
                }
                else if (channelId === streamChannelId) {
                    streamChannel = channel;
                }
            }
        }
        
        client.on('messageCreate', async (msg) => {
            if (streamChannelIds.indexOf(msg.channel.id) === -1) return;
            for (const embed of msg.embeds) {
                if (embed.title === 'Now streaming: Left 4 Dead 2') {
                    const embedCopy = new MessageEmbed()
                        .setAuthor({ name: embed.author.name, iconURL: embed.author.iconURL, url: embed.author.url })
                        .setThumbnail(embed.thumbnail.url)
                        .setTitle(embed.title)
                        .setURL(embed.url)
                        .setDescription(embed.description)
                        .setFooter({ text: embed.footer.text, iconURL: embed.footer.iconURL })
                        .setColor(0x6441a4);
                        
                    await streamChannel.send({ content: msg.content, embeds: [embedCopy] });
                    break;
                }
            }
        });

        logger.debug(`Following ${streamChannels.length} channels for twitch stream notifications.`);
        logger.debug('Twitch stream notifications initialized.');
    }
}

module.exports = TwitchStreamNotifications;
