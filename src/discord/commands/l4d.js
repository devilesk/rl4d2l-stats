const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../config');
const logger = require('../../cli/logger');
const { interactionFromRole } = require('../util');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('l4d')
        .setDescription('Ping for an inhouse game!')
        .addStringOption(option => option.setName('message').setDescription('Optional message')),
    async execute(interaction) {
        const { guild, channel } = interaction;

        if (channel.name !== config.settings.inhouseChannel) return;
        if (interactionFromRole(interaction, config.settings.inhouseBlacklistRole)) return;

        const now = new Date();
        const day = now.getUTCDay();
        const hours = now.getUTCHours();
        const schedule = config.settings.pingSchedule;
        if (hours >= schedule[day][0] && hours < schedule[day][1]) return;

        await interaction.reply({ content: 'Pinging for game', ephemeral: true });

        const pingMsg = interaction.options.getString('message');
        const msg = `${interaction.user.username}` + (pingMsg ? ': ' + pingMsg : ' pinged.');
        const role = guild.roles.cache.find(role => role.name === config.settings.inhouseRole);
        const message = await interaction.channel.send(`${role} ${msg}`);

        logger.info(`${interaction.user.username} pinged.`);
    },
};