const dotenv = require('dotenv');

const envConfig = dotenv.config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' });
const { CommandoClient } = require('discord.js-commando');
const execQuery = require('../common/execQuery.js');
const formatDate = require('../common/formatDate');
const getGeneratedTeams = require('./teamgen');
const MessageCache = require('./messageCache');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../cli/logger');
const connection = require('./connection');
const config = require('./config');
const processReactions = require('./processReactions');
const { HOUR_MILLISECONDS, msgRemainingTimeLeft } = require('./util');

const messageCache = new MessageCache(config);

config.load().then(() => {
    

    
    const client = new CommandoClient({
        commandPrefix: config.settings.commandPrefix,
        owner: config.settings.owner,
        invite: config.settings.invite,
    });
    client.registry
        .registerDefaultTypes()
        .registerGroups([
            ['league', 'League Commands'],
            ['admin', 'Admin Commands'],
            ['owner', 'Owner Commands'],
        ])
        .registerDefaultGroups()
        .registerDefaultCommands()
        .registerCommandsIn(path.join(__dirname, 'commands'));

    const _processReactions = processReactions(client, messageCache);
    client.on('messageReactionAdd', async (msgReaction, user) => _processReactions(msgReaction.message));
    client.on('messageReactionRemove', async (msgReaction, user) => _processReactions(msgReaction.message));
    client.on('messageReactionRemoveAll', async (msg) => _processReactions(msg));
    client.on('messageDelete', async (msg) => {
        if (messageCache.uncacheMessage(msg)) {
            await msg.channel.setTopic('');
        }
    });
    client.on('messageDeleteBulk', async (msgs) => {
        for (const msg of msgs.array()) {
            if (messageCache.uncacheMessage(msg)) {
                await msg.channel.setTopic('');
            }
        }
    });

    // track messages that ping L4D role
    client.on('message', async (msg) => {
        await _processReactions(msg);
        setTimeout(() => _processReactions(msg).catch(logger.error), HOUR_MILLISECONDS); // message ping expiration timer
    });

    client.on('error', logger.error);

    client.on('ready', async () => {
        logger.info(`Logged in as ${client.user.tag}!`);
        for (const owner of client.owners) {
            await owner.send(`Logged in as ${client.user.tag}!`);
        }
        await messageCache.load(client);
        if (messageCache.cache) {
            await _processReactions(messageCache.cache);
            if (messageCache.cache) { // check if there is still a cached message after processing reactions
                const remainingTimeLeft = msgRemainingTimeLeft(messageCache.cache);
                logger.info(`Cached message remaining time left: ${remainingTimeLeft}`);
                setTimeout(() => _processReactions(messageCache.cache).catch(logger.error), remainingTimeLeft); // message ping expiration timer
            }
        }
    });
    
    client.login(process.env.TOKEN);
});
