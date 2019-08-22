const dotenv = require('dotenv');

const envConfig = dotenv.config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' });
const {
    RichEmbed,
    Collection,
} = require('discord.js');
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

const messageCache = new MessageCache();

config.load().then(() => {
    
    // when a message less than an hour old that pings L4D role gets 8 reactions, then bot will ping all reactors.
    const processReactions = async (msg) => {
        if (await messageCache.isValidMessage(msg, config.settings.inhouseRole)) {
            const users = msg.reactions.reduce((acc, reaction) => (acc === null ? reaction.users.clone() : acc.concat(reaction.users)), new Collection());
            logger.info(`processing message with ${users.size} reacts...`);
            if (users.filter((user) => user.id !== client.user.id).size < 8 && !users.has(client.user.id)) {
                await msg.channel.setTopic(`${users.size} ${users.size === 1 ? 'react' : 'reacts'}. React here to play: https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`);
            }
            // check if 8 reacts and if bot has not reacted to message
            if (users.size === 8 && !users.has(client.user.id)) {
                logger.info('8 reactions detected...');
                await msg.react('✅'); // bot reacts to message to prevent pinging reactors again if reactions change later
                await msg.channel.send(users.array().join(' '), await getGeneratedTeams(process.env.DATA_DIR, connection, users.map(user => user.id)));
                await msg.channel.setTopic('');
                messageCache.uncacheMessage(msg);
            }
        }
    }

    
    const client = new CommandoClient({
        commandPrefix: config.settings.commandPrefix,
        owner: config.settings.owner,
        invite: config.settings.invite,
    });
    client.registry
        .registerDefaultTypes()
        .registerGroups([
            ['league', 'League Commands'],
        ])
        .registerDefaultGroups()
        .registerDefaultCommands()
        .registerCommandsIn(path.join(__dirname, 'commands'));
        
    client.on('messageReactionAdd', async (msgReaction, user) => processReactions(msgReaction.message));
    client.on('messageReactionRemove', async (msgReaction, user) => processReactions(msgReaction.message));

    // track messages that ping L4D role
    client.on('message', async (msg) => messageCache.isValidMessage(msg, config.settings.inhouseRole));

    client.on('error', logger.error);

    client.on('ready', async () => {
        await messageCache.load(client, config.settings);
        const cachedMessage = await messageCache.getCachedMessage(client);
        if (cachedMessage) {
            await processReactions(cachedMessage);
        }
        logger.info(`Logged in as ${client.user.tag}!`);
    });
    
    client.login(process.env.TOKEN);
});
