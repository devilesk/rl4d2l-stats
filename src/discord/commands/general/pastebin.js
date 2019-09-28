const { Command } = require('discord.js-commando');
const config = require('../../config');
const createPaste = require('../../pastebin');
const logger = require('../../../cli/logger');

class PastebinCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'pastebin',
            group: 'general',
            memberName: 'pastebin',
            description: 'Create a pastebin paste.',
            argsPromptLimit: 0,
            args: [
                {
                    key: 'content',
                    prompt: 'Paste content',
                    type: 'string',
                },
            ]
        });
    }

    async run(msg, { content }) {
        if (config.settings.botChannels.indexOf(msg.channel.name) === -1) return;
        const result = await createPaste(content);
        if (result.error) {
            return msg.reply(`Error creating paste: ${result.error}.`);
        }
        return msg.reply(`Paste created: ${result.link}.`);
    }
}

module.exports = PastebinCommand;
