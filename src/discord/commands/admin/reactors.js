const { Command } = require('discord.js-commando');
const { Collection } = require('discord.js');
const Promise = require('bluebird');
const msgFromAdmin = require('../../msgFromAdmin');
const config = require('../../config');
const logger = require('../../../cli/logger');

const partition = (arr, length) => {
    const result = [];
    for (let i = 0; i < arr.length; i++) {
        if (i % length === 0) {
            result.push([]);
        }
        result[result.length - 1].push(arr[i]);
    }
    return result;
};

class ReactorsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'reactors',
            group: 'admin',
            memberName: 'reactors',
            description: 'List users that have reacted to a message.',
            argsPromptLimit: 0,
            args: [
                {
                    key: 'channel',
                    prompt: 'Channel mention',
                    type: 'channel',
                },
                {
                    key: 'messageId',
                    prompt: 'Message ID',
                    type: 'string',
                },
            ],
        });
    }

    hasPermission(msg) {
        return msgFromAdmin(msg);
    }

    async run(msg, { channel, messageId }) {
        let fetchedMsg;
        try {
            fetchedMsg = await channel.messages.fetch(messageId);
        }
        catch (e) {
            logger.error(e);
            return msg.say(`Message ${messageId} in ${channel} not found.`);
        }
        const users = await Promise.reduce(fetchedMsg.reactions.cache.array(), async (users, reaction) => {
            const fetchedUsers = await reaction.users.fetch();
            logger.debug(`fetched message ${fetchedMsg.id} reaction ${reaction.emoji} users ${fetchedUsers.size}`);
            return users.concat(fetchedUsers);
        }, new Collection());
        const groups = partition(users.array().map(user => msg.guild.member(user).displayName).sort((a, b) => a.localeCompare(b)), 20);
        for (const group of groups) {
            await msg.say((group === groups[0] ? `https://discordapp.com/channels/${msg.guild.id}/${channel.id}/${fetchedMsg.id} ${users.size} unique reactors:\n` : '') + `${group.join('\n')}`);
        }
    }
}

module.exports = ReactorsCommand;
