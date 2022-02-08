const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../config');
const logger = require('../../cli/logger');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reload commands and config.')
        .setDefaultPermission(false)
        .addStringOption(option => option.setName('command').setDescription('Command name')),
    async execute(interaction) {
        const { client } = interaction;

        const commandName = interaction.options.getString('command');

        if (!commandName || commandName === 'config') {
            await config.load();
            logger.info(`Reloaded config.`);
            await interaction.reply({ content: 'Reloaded config.', ephemeral: true });
            return;
        }

        logger.info(`Reloading command ${commandName}.`);

        const command = client.commands.get(commandName);
        delete require.cache[require.resolve(`../commands/${command.data.name}.js`)];

        try {
            const newCommand = require(`../commands/${command.data.name}.js`);
            client.commands.set(newCommand.data.name, newCommand);
            logger.info(`Reloaded command ${commandName}.`);
            await interaction.reply({ content: `Command \`${newCommand.data.name}\` was reloaded!`, ephemeral: true });
        } catch (error) {
            logger.error(error);
            await interaction.reply({ content: `There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``, ephemeral: true });
        }
    },
};