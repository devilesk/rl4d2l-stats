const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const config = require('../config');
const logger = require('../../cli/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stream')
        .setDescription('Restart server.')
        .setDefaultPermission(false)
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Stream command action')
                .setRequired(true)
                .addChoice('Add', 'add')
                .addChoice('Remove', 'remove')
                .addChoice('List', 'list'))
        .addStringOption(option =>
            option.setName('name_or_url')
                .setDescription('Stream name or url')),
    async execute(interaction) {
        const { guild, channel, member, client } = interaction;
        const { twitchNotificationServer } = client;

        const action = interaction.options.getString('action');
        const nameOrUrl = interaction.options.getString('name_or_url');

        await interaction.deferReply({ ephemeral: true });

        // list subscriptions
        if (action === 'list') {
            const subscriptions = await twitchNotificationServer.requestSubscriptionList();
            
            const embed = new MessageEmbed()
                .setTitle('Twitch Stream Subscriptions')
                .setColor(0x6441a4);
            for (const subscription of subscriptions) {
                try {
                    const userId = subscription.topic.replace('https://api.twitch.tv/helix/streams?user_id=', '');
                    const userData = await twitchNotificationServer.requestUserById(userId);
                    embed.addField(userData.login, `Expires: ${new Date(subscription.expires_at)}`, false);
                }
                catch (e) {
                    logger.error(e);
                    await interaction.editReply({ content: 'Error creating subscription list.' });
                    return;
                }
            }
            await interaction.editReply({ embeds: [embed] });
        }
        // add/remove subscription
        else {
            if (!nameOrUrl) {
                await interaction.editReply({ content: 'No twitch username or stream link given. Usage: `!stream <add|remove> <twitch username or link>`.' });
                return;
            }
            
            const streamName = nameOrUrl.match(/([^\/]*)\/*$/)[1];
        
            // look up userid
            let userId;
            try {
                const userData = await twitchNotificationServer.requestUserByName(streamName);
                userId = userData.id;
            }
            catch (e) {
                logger.error(e);
                await interaction.editReply({ content: 'User lookup error.' });
                return;
            }
            
            // subscribe/unsubscribe request
            try {
                if (action === 'add') {
                    await twitchNotificationServer.addSubscription(userId);
                }
                else {
                    await twitchNotificationServer.removeSubscription(userId);
                }
            }
            catch (e) {
                logger.error(e);
                await interaction.editReply({ content: 'Add/remove subscription error.' });
                return;
            }
            
            await interaction.editReply({ content: 'Subscription updated.' });
        }
    },
};