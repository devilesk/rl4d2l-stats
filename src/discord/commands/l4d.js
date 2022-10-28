const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../config');
const logger = require('../../cli/logger');
const { interactionFromRole, getUsersWithRole } = require('../util');
const { days, getDayHourMap } = require('../roleTime');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('l4d')
        .setDescription('Ping for an inhouse game!')
        .addStringOption(option => option.setName('message').setDescription('Optional message')),
    async execute(interaction) {
        const { guild, channel, createdAt, createdTimestamp, client } = interaction;

        if (channel.name !== config.settings.inhouseChannel) {
            await interaction.reply({ content: 'Command cannot be used in this channel.', ephemeral: true });
            return;
        }
        if (interactionFromRole(interaction, config.settings.inhouseBlacklistRole)) {
            await interaction.reply({ content: 'You are blacklisted from using this command.', ephemeral: true });
            return;
        }
        if (client.messageCache.cache && createdTimestamp - client.messageCache.cache.createdTimestamp < 60 * 1000) {
            await interaction.reply({ content: 'Command was already used in the last minute.', ephemeral: true });
            return;
        }

        const now = new Date();
        const day = now.getUTCDay();
        const hours = now.getUTCHours();

        if (config.settings.adminRoles.every(adminRole => !interactionFromRole(interaction, adminRole)) && hours >= config.settings.pingSchedule[day][0] && hours < config.settings.pingSchedule[day][1]) {
            await interaction.reply({ content: 'Command not allowed at this time.', ephemeral: true });
            return;
        }

        await interaction.reply({ content: 'Updating ping roles', ephemeral: true });

        // get users with matching role schedule times
        const dayHourMap = getDayHourMap(createdAt);
        for (const [timezone, d] of Object.entries(dayHourMap)) {
            logger.info(`${timezone} ${d.day} ${d.hour}`);
        }

        const usersToPing = new Set();
        for ([userId, userSchedule] of Object.entries(config.roleSchedule)) {
            const userTimezone = userSchedule['timezone'];
            const userDay = dayHourMap[userTimezone]['day'];
            const userHour = dayHourMap[userTimezone]['hour'];
            logger.info(`checking schedule ${userId} ${userTimezone} ${userDay} ${userHour} ${userDay in userSchedule['days'] && userHour in userSchedule['days'][userDay]}`);
            if (userDay in userSchedule['days'] && userSchedule['days'][userDay].indexOf(userHour) !== -1) {
                usersToPing.add(userId);
            }
        }
        logger.info(`${usersToPing.size} users to ping`);

        // get users who currently have scheduled role
        const usersWithL4DScheduledRole = await getUsersWithRole(guild, config.settings.inhouseRoleScheduled); // array of users who have the role
        const userIdsWithL4DScheduledRole = new Set(usersWithL4DScheduledRole.map(m => m.id)); // array of user IDs who have the role

        const roleL4DScheduled = guild.roles.cache.find(role => role.name === config.settings.inhouseRoleScheduled); //the role to check
        let added = 0;
        let removed = 0;
        // add role to users to be pinged that are missing role
        for (const userId of usersToPing) {
            if (userIdsWithL4DScheduledRole.has(userId)) {
                userIdsWithL4DScheduledRole.delete(userId);
            }
            else {
                try {
                    const user = await guild.members.fetch(userId);
                    await user.roles.add(roleL4DScheduled);
                    added++;
                }
                catch (e) {
                    logger.error(e);
                }
            }
        }
        // remove role from remaining users not to be pinged
        for (const userId of userIdsWithL4DScheduledRole) {
            const user = await guild.members.fetch(userId);
            await user.roles.remove(roleL4DScheduled);
            removed++;
        }

        logger.info(`${added} added role, ${removed} removed role`);

        await interaction.editReply({ content: 'Pinging for game', ephemeral: true });

        const pingMsg = interaction.options.getString('message');
        const msg = `${interaction.user.username}` + (pingMsg ? ': ' + pingMsg : ' pinged.');
        // ping both L4D and L4D (scheduled) roles
        const roleL4D = guild.roles.cache.find(role => role.name === config.settings.inhouseRole);
        const message = await channel.send(`${roleL4D} ${roleL4DScheduled} ${msg}`);

        await channel.setTopic(`React here to play: https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id}.`);

        logger.info(`${interaction.user.username} pinged. ${createdAt}`);
    },
};