const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../config');
const logger = require('../../cli/logger');
const { interactionFromRole } = require('../util');

const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('l4dtest')
        .setDescription('Ping for an inhouse game!')
        .setDefaultPermission(false)
        .addStringOption(option => option.setName('message').setDescription('Optional message')),
    async execute(interaction) {
        const { guild, channel, createdAt } = interaction;

        if (channel.name !== config.settings.inhouseChannel) return;
        if (interactionFromRole(interaction, config.settings.inhouseBlacklistRole)) return;

        const estDate = new Date(createdAt.toLocaleString("en-US", {timeZone: "America/New_York"}));
        const cstDate = new Date(createdAt.toLocaleString("en-US", {timeZone: "America/Chicago"}));
        const mstDate = new Date(createdAt.toLocaleString("en-US", {timeZone: "America/Denver"}));
        const pstDate = new Date(createdAt.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
        const dates = {
            est: {
                day: days[estDate.getDay()],
                hour: estDate.getHours().toString(),
            },
            cst: {
                day: days[cstDate.getDay()],
                hour: cstDate.getHours().toString(),
            },
            mst: {
                day: days[mstDate.getDay()],
                hour: mstDate.getHours().toString(),
            },
            pst: {
                day: days[pstDate.getDay()],
                hour: pstDate.getHours().toString(),
            },
        }
        
        for (const [timezone, d] of Object.entries(dates)) {
            logger.info(`${timezone} ${d.day} ${d.hour}`);
        }

        await interaction.reply({ content: 'Updating ping roles', ephemeral: true });
        
        const usersToPing = new Set();
        for ([userId, userSchedule] of Object.entries(config.roleSchedule)) {
            const userTimezone = userSchedule['timezone'];
            const userDay = dates[userTimezone]['day'];
            const userHour = dates[userTimezone]['hour'];
            logger.info(`checking schedule ${userId} ${userTimezone} ${userDay} ${userHour} ${userDay in userSchedule['days'] && userHour in userSchedule['days'][userDay]}`);
            if (userDay in userSchedule['days'] && userSchedule['days'][userDay].indexOf(userHour) !== -1) {
                usersToPing.add(userId);
            }
        }
        logger.info(`${usersToPing.size} users to ping`);
        
        await guild.members.fetch() //cache all members in the server
        const roleScheduled = guild.roles.cache.find(role => role.name === config.settings.inhouseRoleScheduled) //the role to check
        const role = guild.roles.cache.find(role => role.name === config.settings.inhouseRole);
        const usersWithRole = new Set(role.members.map(m => m.id)) // array of user IDs who have the role

        let added = 0;
        let removed = 0;
        // add role to users to be pinged that are missing role
        for (const userId of usersToPing) {
            if (usersWithRole.has(userId)) {
                usersWithRole.delete(userId);
            }
            else {
                const user = await guild.members.fetch(userId);
                await user.roles.add(roleScheduled);
                added++;
            }
        }
        // remove role from remaining users not to be pinged
        for (const userId of usersWithRole) {
            const user = await guild.members.fetch(userId);
            await user.roles.remove(roleScheduled);
            removed++;
        }
        logger.info(`${added} added role, ${removed} removed role`);

        await interaction.editReply({ content: 'Pinging for game', ephemeral: true });

        const pingMsg = interaction.options.getString('message');
        const msg = `${interaction.user.username}` + (pingMsg ? ': ' + pingMsg : ' pinged.');
        const message = await interaction.channel.send(`${role} ${roleScheduled} ${msg}`);

        logger.info(`${interaction.user.username} pinged. ${createdAt}`);
    },
};