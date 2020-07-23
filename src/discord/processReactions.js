const { Collection } = require('discord.js');
const logger = require('../cli/logger');
const config = require('./config');
const getGeneratedTeams = require('./teamgen');
const connection = require('./connection');
const { msgHasL4DMention, msgRemainingTimeLeft } = require('./util');

let savedUsers = new Collection();

// when a message less than an hour old that pings L4D role gets 8 reactions, then bot will ping all reactors.
const processReactions = (client, messageCache) => async (msg) => {
    if (msg.channel.name !== config.settings.inhouseChannel) return;
    if (msgHasL4DMention(msg)) {
        let users = await messageCache.fetchMessageReactionUsers(msg); // fetch users because msg.reactions not updated when admin removes a react
        // const users = msg.reactions.cache.reduce((acc, reaction) => acc.concat(reaction.users), new Collection());
        if (!users.has(client.user.id)) { // check if bot has not reacted to message
            if (msgRemainingTimeLeft(msg) > 0) {
                if (messageCache.isLatest(msg)) {
                    logger.info(`processing message ${msg.id} with ${users.size} reacts...`);
                    if (users.size < 8) {
                        savedUsers = users.clone();
                        await msg.channel.setTopic(
                            `${users.size} ${users.size === 1 ? 'react' : 'reacts'}. React here to play: https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}.` +
                            (users.size > 0 ? `\nReactors: ${users.array().map(user => msg.guild.member(user).displayName).join(', ')}` : '')
                        );
                        await messageCache.cacheMessage(msg);
                    }
                    else {
                        await msg.react('✅'); // bot reacts to message to prevent pinging reactors again if reactions change later
                        logger.debug(`${users.size} reactions detected... ${users.array().map(user => user.id).join(',')}`);
                        // if more than 8 users, then randomly select among last users.
                        if (users.size > 8) {
                            logger.debug(`${savedUsers.size} savedUsers: ${savedUsers.array().map(user => user.id).join(',')}`);
                            const lastUsers = users.filter(user => !savedUsers.has(user.id));
                            const randomUsers = lastUsers.random(8 - savedUsers.size);
                            logger.debug(`randomly selected ${randomUsers.array().map(user => user.id).join(',')} from ${lastUsers.array().map(user => user.id).join(',')}`);
                            users = savedUsers.concat(randomUsers);
                        }
                        await msg.channel.send(users.array().map(user => `${user}`).join(' '), await getGeneratedTeams(process.env.DATA_DIR, connection, users.map(user => user.id), null, true, true));
                        await msg.channel.setTopic(config.strings.server);
                        messageCache.uncacheMessage(msg);
                    }
                }
                else {
                    logger.info(`message ${msg.id} not latest`);
                    await msg.react('🚫');
                }
            }
            else {
                logger.info(`message ${msg.id} expired with ${users.size} reacts`);
                await msg.react('🚫');
                if (messageCache.uncacheMessage(msg)) {
                    await msg.channel.setTopic('');
                    msg.channel.guild.client.emit('pingExpired', msg.channel);
                }
            }
        }
    }
};

module.exports = processReactions;
