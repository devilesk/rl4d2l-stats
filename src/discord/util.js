const { Collection } = require('discord.js');
const Promise = require('bluebird');
const config = require('./config');
const logger = require('../cli/logger');

const HOUR_MILLISECONDS = 3600000;
const msgHasL4DMention = msg => msg.mentions.roles.find(role => role.name === config.settings.inhouseRole);
const msgRemainingTimeLeft = msg => Math.max(msg.createdTimestamp + HOUR_MILLISECONDS - Date.now(), 0);

const fetchMessageReactionUsers = async (msg) => {
    return Promise.reduce(msg.reactions.cache.values(), async (users, reaction) => {
        const fetchedUsers = await reaction.users.fetch();
        logger.debug(`fetched message ${msg.id} reaction ${reaction.emoji} users ${fetchedUsers.size}`);
        return users.concat(fetchedUsers);
    }, new Collection());
}

const msgFromRole = async (msg, roleName) => {
    const user = msg.author;
    const member = await msg.guild.members.fetch(user.id);
    if (member) return member.roles.cache.some(role => role.name === roleName);
    return false;
};

const interactionFromRole = (interaction, roleName) => {
    const member = interaction.member;
    if (member) return member.roles.cache.some(role => role.name === roleName);
    return false;
};

const getUsersWithRole = async (guild, roleName) => {
    await guild.members.fetch(); //cache all members in the server
    const role = guild.roles.cache.find(role => role.name === roleName);
    return role.members;
};

module.exports = {
    HOUR_MILLISECONDS,
    msgHasL4DMention,
    msgRemainingTimeLeft,
    fetchMessageReactionUsers,
    msgFromRole,
    interactionFromRole,
    getUsersWithRole
};
