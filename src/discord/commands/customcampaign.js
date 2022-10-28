const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../config');
const logger = require('../../cli/logger');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('customcampaign')
        .setDescription('Custom campaign download links and installation instructions.'),
    async execute(interaction) {
        const { guild, channel, member } = interaction;

        if (channel.name !== config.settings.inhouseChannel && config.settings.botChannels.indexOf(channel.name) === -1) {
            await interaction.reply({ content: 'Command cannot be used in this channel.', ephemeral: true });
            return;
        }

        const embed = new MessageEmbed()
            .setTitle(config.strings.customcampaigns.title)
            .setDescription(config.strings.customcampaigns.description)
            .setColor(0xa10e90);
        for (const entry of config.strings.customcampaigns.fields) {
            embed.addField(entry[0], entry[1], false);
        }

        await interaction.reply({ embeds: [embed] });
    },
};