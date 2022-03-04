const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const config = require('../config');
const logger = require('../../cli/logger');
const { interactionFromRole } = require('../util');
const { days, getDayHourMap } = require('../roleTime');
const connection = require('../connection');
const execQuery = require('../../common/execQuery');

const activePlayerQuery = `SELECT discord as discord
FROM players a
JOIN (SELECT steamid
FROM matchlog
WHERE matchId >= (SELECT MAX(startedAt) FROM season)
GROUP BY steamid
HAVING COUNT(*) >= 3) b
ON a.steamid = b.steamid;`;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('online')
        .setDescription('Check how many users would receive a scheduled role time ping.'),
    async execute(interaction) {
        const { guild, channel, createdAt } = interaction;

        if (channel.name !== config.settings.inhouseChannel && config.settings.botChannels.indexOf(channel.name) === -1) {
            await interaction.reply({ content: 'Command cannot be used in this channel.', ephemeral: true });
            return;
        }

        await interaction.reply({ content: 'Checking role time schedules' });

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

        const { results } = await execQuery(connection, activePlayerQuery);
        const activePlayers = results.map(row => row.discord);

        const members = await guild.members.fetch();
        const activeMembers = members.filter(member => activePlayers.indexOf(member.id) !== -1);
        const total_online = activeMembers.filter(member => !member.user?.bot && member.presence?.status === 'online'); 
        const total_idle = activeMembers.filter(member => !member.user?.bot && member.presence?.status === 'idle'); 
        const total_offline = activeMembers.filter(member => !member.user?.bot && member.presence?.status === 'offline'); 
        const total_dnd = activeMembers.filter(member => !member.user?.bot && member.presence?.status === 'dnd'); 
        
        const l4d_online = total_online.filter(member => member.roles.cache.find(role => role.name === config.settings.inhouseRole)); 
        const l4d_idle = total_idle.filter(member => member.roles.cache.find(role => role.name === config.settings.inhouseRole)); 
        const l4d_offline = total_offline.filter(member => member.roles.cache.find(role => role.name === config.settings.inhouseRole)); 
        const l4d_dnd = total_dnd.filter(member => member.roles.cache.find(role => role.name === config.settings.inhouseRole)); 
        
        const l4dscheduled_online = total_online.filter(member => usersToPing.has(member.id)); 
        const l4dscheduled_idle = total_idle.filter(member => usersToPing.has(member.id)); 
        const l4dscheduled_offline = total_offline.filter(member => usersToPing.has(member.id)); 
        const l4dscheduled_dnd = total_dnd.filter(member => usersToPing.has(member.id));

        const dateFormatOptions = { weekday: 'long', hour: 'numeric', timeZoneName: 'short' };
        const scheduledUsersLabel = `${usersToPing.size} scheduled ${usersToPing.size === 1 ? 'user' : 'users'} for ${createdAt.toLocaleString("en-US", dateFormatOptions)}.`;
        logger.info(scheduledUsersLabel);

        const embed = new MessageEmbed()
            .setColor('#c934eb')
            .setTitle(`User Status of ${activeMembers.size} active players (at least 3 games this season)`)
            .addField('Total', `${total_online.size} online, ${total_idle.size} idle, ${total_dnd.size} DND`)
            .addField('@L4D', `${l4d_online.size} online, ${l4d_idle.size} idle, ${l4d_dnd.size} DND`)
            .addField('@L4D (scheduled)', `${l4dscheduled_online.size} online, ${l4dscheduled_idle.size} idle, ${l4dscheduled_dnd.size} DND`)
            .setFooter({ text: scheduledUsersLabel });

        await interaction.editReply({ content: null, embeds: [embed] });
    },
};