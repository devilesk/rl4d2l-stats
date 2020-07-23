const { Collection } = require('discord.js');
const Promise = require('bluebird');
const config = require('./config');
const logger = require('../cli/logger');

const HOUR_MILLISECONDS = 3600000;
const msgHasL4DMention = msg => msg.mentions.roles.find(role => role.name === config.settings.inhouseRole);
const msgRemainingTimeLeft = msg => Math.max(msg.createdTimestamp + HOUR_MILLISECONDS - Date.now(), 0);

const fetchMessageReactionUsers = async (msg) => {
    return Promise.reduce(msg.reactions.cache.array(), async (users, reaction) => {
        const fetchedUsers = await reaction.users.fetch();
        logger.debug(`fetched message ${msg.id} reaction ${reaction.emoji} users ${fetchedUsers.size}`);
        return users.concat(fetchedUsers);
    }, new Collection());
}

const msgFromRole = (msg, roleName) => {
    const user = msg.author;
    const member = msg.guild.member(user);
    if (member) return member.roles.cache.some(role => role.name === roleName);
    return false;
};
    
module.exports = {
    HOUR_MILLISECONDS,
    msgHasL4DMention,
    msgRemainingTimeLeft,
    fetchMessageReactionUsers,
    msgFromRole
};
