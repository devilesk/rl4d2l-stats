const fs = require('fs-extra');
const path = require('path');
const logger = require('../cli/logger');

const msgToCache = msg => ({
    guildId: msg.channel.guild.id,
    channelId: msg.channel.id,
    messageId: msg.id,
    createdTimestamp: msg.createdTimestamp,
});

const msgHasL4DMention = (msg, inhouseRole) => msg.mentions.roles.find((role) => role.name === inhouseRole);

const msgLessThanOneHourAgo = msg => Date.now() - msg.createdTimestamp < 3600000;

class MessageCache {
    constructor() {
        this.path = path.join(__dirname, 'messageCache.json');
        this.cache = null;
    }
    
    async load(client, settings) {
        const exists = await fs.pathExists(this.path);
        if (exists) {
            logger.info('loading message cache file...');
            this.cache = await fs.readJson(this.path);
            if (msgLessThanOneHourAgo(this.cache)) {
                await this.fetchCachedMessage(client);
            }
            else {
                logger.info('clearing stale message cache');
                this.cache = null;
            }
        }
        else {
            logger.info('no message cache file...');
            for (const guild of client.guilds.array()) {
                const channel = guild.channels.find(channel => channel.name === settings.inhouseChannel);
                if (channel) {
                    logger.info('fetching messages from general channel...');
                    const messages = await channel.fetchMessages();
                    for (const msg of messages.array()) {
                        if (await this.isValidMessage(msg, settings.inhouseRole)) {
                            await this.fetchCachedMessage(client);
                        }
                    }
                }
            }
        }
    }
    
    async getCachedMessage(client) {
        if (this.cache) {
            return this.fetchCachedMessage(client);
        }
        return null;
    }
    
    async fetchCachedMessage(client) {
        const guild = client.guilds.get(this.cache.guildId);
        const channel = guild.channels.get(this.cache.channelId);
        const msg = await channel.fetchMessage(this.cache.messageId);
        for (const reaction of msg.reactions.array()) {
            await reaction.fetchUsers();
        }
        return msg;
    }
    
    async save() {
        return fs.writeJson(this.path, this.cache);
    }
    
    async cacheMessage(msg) {
        if (!this.cache || this.cache.createdTimestamp < msg.createdTimestamp) {
            this.cache = msgToCache(msg);
            await this.save();
        }
    }
    
    isCached(msg) {
        const cache = msgToCache(msg);
        return this.cache && this.cache.guildId === cache.guildId && this.cache.channelId === cache.channelId && this.cache.messageId === cache.messageId;
    }
    
    uncacheMessage(msg) {
        if (this.isCached(msg)) {
            this.cache = null;
        }
    }
    
    async isValidMessage(msg, inhouseRole) {
        if (msgHasL4DMention(msg, inhouseRole) && msgLessThanOneHourAgo(msg) && (!this.cache || this.cache.createdTimestamp <= msg.createdTimestamp)) {
            await this.cacheMessage(msg);
            return true;
        }
        return false;
    }
}

module.exports = MessageCache;