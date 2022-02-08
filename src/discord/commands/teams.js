const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../config');
const logger = require('../../cli/logger');
const { MessageEmbed } = require('discord.js');
const connection = require('../connection');
const getGeneratedTeams = require('../teamgen');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('teams')
        .setDescription('Display top 5 closest team matchups from team generator.')
        .addStringOption(option =>
            option.setName('players')
                .setDescription('Comma-separated list of players'))
        .addStringOption(option =>
            option.setName('range')
                .setDescription('Stats range')
                .addChoice('Season', 'season')
                .addChoice('All', 'all')),
    async execute(interaction) {
        const { guild, channel, member } = interaction;

        if (channel.name !== config.settings.inhouseChannel && config.settings.botChannels.indexOf(channel.name) === -1) return;
        
        const statsRange = interaction.options.getString('range') || 'season';
        const players = interaction.options.getString('players');
        const seasonal = statsRange === 'season';
        logger.info(`Teams command. statsRange: ${statsRange}. players: ${players}`);

        const embed = await getGeneratedTeams(process.env.DATA_DIR, connection, null, players === null ? players : players.split(','), seasonal, false)

        await interaction.reply({ embeds: [embed] });
    },
};