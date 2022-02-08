const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../config');
const logger = require('../../cli/logger');
const { MessageEmbed } = require('discord.js');
const connection = require('../connection');
const lastPlayedMapsQuery = require('../lastPlayedMapsQuery');
const execQuery = require('../../common/execQuery');
const formatDate = require('../../common/formatDate');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('map')
        .setDescription('Display maps with last played date.'),
    async execute(interaction) {
        const { guild, channel } = interaction;
        logger.info(`Map command`);

        if (channel.name !== config.settings.inhouseChannel && config.settings.botChannels.indexOf(channel.name) === -1) return;

        const { results } = await execQuery(connection, lastPlayedMapsQuery(config.settings.ignoredCampaigns));
        const embed = new MessageEmbed()
            .setTitle('Maps')
            .setColor(0x20F622);
        const title = 'Last Played Date | Map';
        const content = results.map(row => `\`${formatDate(new Date(row.startedAt * 1000)).slice(0, -6).padEnd(10, ' ')} | ${row.campaign}\``).join('\n');
        embed.addField(title, content, false);
        
        await interaction.reply({ embeds: [embed] });
    },
};