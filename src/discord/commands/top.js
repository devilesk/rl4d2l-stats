const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../config');
const logger = require('../../cli/logger');
const { MessageEmbed } = require('discord.js');
const connection = require('../connection');
const execQuery = require('../../common/execQuery');
const topStats = require('../topStats');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('top')
        .setDescription('Display top players for various stats.')
        .addStringOption(option =>
            option.setName('range')
                .setDescription('Stats range')
                .addChoice('Season', 'season')
                .addChoice('All-time', 'all')),
    async execute(interaction) {
        const { guild, channel, member } = interaction;

        if (config.settings.botChannels.indexOf(channel.name) === -1) {
            await interaction.reply({ content: 'Command cannot be used in this channel.', ephemeral: true });
            return;
        }

        await interaction.deferReply();

        const statsRange = interaction.options.getString('range') || 'season';
        const seasonal = statsRange === 'season';
        logger.info(`Top command. statsRange: ${statsRange}`);

        const embed = new MessageEmbed()
            .setTitle(`Top ${seasonal ? 'season' : 'lifetime'} stats (Need to play 20 or more rounds)`)
            .setColor(0x000dff);

        for (const topStat of topStats) {
            const { results } = await execQuery(connection, topStat.query(seasonal));
            const str = results.map(topStat.format).join('\n') || 'N/A';
            embed.addField(topStat.title, str, true);
        }

        await interaction.editReply({ embeds: [embed] });
    },
};