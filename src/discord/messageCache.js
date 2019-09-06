const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const { Collection } = require('discord.js');
const logger = require('../cli/logger');
const { msgHasL4DMention, msgRemainingTimeLeft } = require('./util');

const serializeMsg = msg => ({
    guildId: msg.channel.guild.id,
    channelId: msg.channel.id,
    messageId: msg.id,
    createdTimestamp: msg.createdTimestamp,
});

class MessageCache {
    constructor(config) {
        this.path = path.join(__dirname, 'messageCache.json');
        this.cache = null;
        this.config = config;
    }

    async load(client) {
        const exists = await fs.pathExists(this.path);
        if (exists) {
            logger.info('loading message cache file...');
            const data = await fs.readJson(this.path);
            this.cache = await this.fetchMessageFromData(client, data);
        }
        for (const guild of client.guilds.array()) {
            const channel = guild.channels.find(channel => channel.name === this.config.settings.inhouseChannel);
            if (channel) {
                logger.info(`fetching messages from guild ${guild.id} general channel...`);
                const messages = await channel.fetchMessages();
                for (const msg of messages.array()) {
                    if (msgHasL4DMention(msg) && msgRemainingTimeLeft(msg) > 0) {
                        logger.info(`checking message ${msg.id}`);
                        if (await this.cacheMessage(msg)) {
                            await this.fetchMessageReactionUsers(msg);
                        }
                        else {
                            logger.info(`reacting to invalid message ${msg.id}`);
                            await msg.react('🚫');
                        }
                    }
                }
            }
        }
    }

    async getCachedMessage(client) {
        return this.cache;
    }

    async fetchMessageFromData(client, data) {
        const guild = client.guilds.get(data.guildId);
        const channel = guild.channels.get(data.channelId);
        try {
            const msg = await channel.fetchMessage(data.messageId);
            const users = await this.fetchMessageReactionUsers(msg);
            logger.info(`fetched message ${msg.id} with ${msg.reactions.size} reacts ${users.size} users`);
            return msg;
        }
        catch (e) {
            logger.error(e);
            await channel.setTopic('');
            return null;
        }
    }

    async fetchMessageReactionUsers(msg) {
        return Promise.reduce(msg.reactions.array(), async (users, reaction) => {
            const fetchedUsers = await reaction.fetchUsers();
            logger.debug(`fetched message ${msg.id} reaction ${reaction.emoji} users ${fetchedUsers.size}`);
            return users.concat(fetchedUsers);
        }, new Collection());
    }

    async save() {
        return fs.writeJson(this.path, serializeMsg(this.cache));
    }

    async cacheMessage(msg) {
        if (msgHasL4DMention(msg) && msgRemainingTimeLeft(msg) > 0 && this.isLatest(msg)) {
            logger.info(`caching message ${msg.id}`);
            if (this.cache && !this.isCached(msg)) {
                logger.info(`reacting to old cache ${this.cache.id}`);
                // try/catch in case cached message no longer exists
                try {
                    await this.cache.react('🚫');
                }
                catch (e) {
                    logger.error(e);
                }
            }
            this.cache = msg;
            await this.save();
            return true;
        }
        return false;
    }

    isCached(msg) {
        return this.cache && this.cache.guild.id === msg.guild.id && this.cache.channel.id === msg.channel.id && this.cache.id === msg.id;
    }

    isLatest(msg) {
        return !this.cache || this.cache.createdTimestamp <= msg.createdTimestamp;
    }

    uncacheMessage(msg) {
        if (this.isCached(msg)) {
            logger.info(`uncaching message ${msg.id}`);
            this.cache = null;
            return true;
        }
        return false;
    }
}

module.exports = MessageCache;
