const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require('./config');
const logger = require('../cli/logger');

const commands = [];
const commandFiles = fs.readdirSync('./src/discord/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

config.load().then(() => {

    const rest = new REST({ version: '9' }).setToken(config.settings.botToken);

    rest.put(Routes.applicationGuildCommands(config.settings.botClientId, config.settings.guild), { body: commands })
        .then(() => logger.info('Successfully registered application commands.'))
        .catch(logger.error);

});