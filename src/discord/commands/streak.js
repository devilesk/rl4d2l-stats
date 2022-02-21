const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../config');
const logger = require('../../cli/logger');
const { MessageEmbed } = require('discord.js');
const connection = require('../connection');
const playerStatsQuery = require('../playerStatsQuery');
const execQuery = require('../../common/execQuery');

const streakQueries = {
    season: `SELECT b.discord, b.name, a.steamid, a.result, a.matchId
FROM matchlog a
JOIN players b ON a.steamid = b.steamid
WHERE a.matchId >= (SELECT MAX(startedAt) from season)
ORDER BY a.steamid, a.matchId desc;`,
    all: `SELECT b.discord, b.name, a.steamid, a.result, a.matchId
FROM matchlog a
JOIN players b ON a.steamid = b.steamid
ORDER BY a.steamid, a.matchId desc;`,
};

const playerExists = async (discordID) => {
    const { results } = await execQuery(connection, 'SELECT * FROM players WHERE discord=?', [discordID]);
    return results.length ? results[0] : null;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('streak')
        .setDescription('Must be registered using `/register` to view streaks.')
        .addStringOption(option =>
            option.setName('range')
                .setDescription('Streak range')
                .addChoice('Season', 'season')
                .addChoice('All', 'all')),
    async execute(interaction) {
        const { guild, channel, member } = interaction;

        if (config.settings.botChannels.indexOf(channel.name) === -1) {
            await interaction.reply({ content: 'Command cannot be used in this channel.', ephemeral: true });
            return;
        }

        await interaction.deferReply();
        
        const streakRange = interaction.options.getString('range') || 'season';
        const seasonal = streakRange === 'season';
        const bPlayerExists = await playerExists(member.id);
        logger.info(`Streak command. streakRange: ${streakRange}. playerExists ${bPlayerExists}`);

        if (!bPlayerExists) {
            await interaction.editReply({ content: 'You were not found! Link your steamid with: !register <steamid>', ephemeral: true });
            return;
        }

        const { results } = await execQuery(connection, streakQueries[streakRange]);
        const players = {};
        const streaks = [];
        const getNewStreak = ({ name, discord, result, matchId }) => ({
            name,
            discord,
            result,
            start: matchId,
            end: matchId,
            count: 1,
        });
        let streak = getNewStreak(results[0]);
        for (const { discord, result, matchId, name } of results.slice(1)) {
            if (streak.discord === discord && streak.result === result) {
                streak.end = matchId;
                streak.count++;
            }
            else {
                //console.log('streak', streak);
                streaks.push(streak);
                streak = getNewStreak({ name, discord, result, matchId });
            }
        }

        const getMaxCount = streaks => streaks.reduce((prev, curr) => prev.count > curr.count ? prev : curr).count;

        const winStreaks = streaks.filter(streak => streak.result === 1);
        const lossStreaks = streaks.filter(streak => streak.result === -1);
        const maxWinCount = getMaxCount(winStreaks);
        const maxLossCount = getMaxCount(lossStreaks);
        const maxWinStreaks = winStreaks.filter(streak => streak.count === maxWinCount);
        const maxLossStreaks = lossStreaks.filter(streak => streak.count === maxLossCount);

        const userWinStreaks = winStreaks.filter(streak => streak.discord === member.id);
        const userLossStreaks = lossStreaks.filter(streak => streak.discord === member.id);
        const maxUserWinCount = getMaxCount(userWinStreaks);
        const maxUserLossCount = getMaxCount(userLossStreaks);
        const maxUserWinStreaks = userWinStreaks.filter(streak => streak.count === maxUserWinCount);
        const maxUserLossStreaks = userLossStreaks.filter(streak => streak.count === maxUserLossCount);

        const userCurrentStreak = streaks.filter(streak => streak.discord === member.id)[0];

        const groupStreaks = streaks => streaks.reduce((acc, curr) => {
            acc[curr.discord] = acc[curr.discord] || curr;
            if (acc[curr.discord].end < curr.end) {
                acc[curr.discord] = curr;
            }
            return acc;
        }, {});

        //console.log(maxWinCount, maxLossCount, maxUserWinCount, maxUserLossCount);
        //console.log(maxWinStreaks.length, maxLossStreaks.length, maxUserWinStreaks.length, maxUserLossStreaks.length);

        const dateFormatOptions = {
            year: 'numeric', month: 'numeric', day: 'numeric',
            timeZone: 'America/New_York'
        };
        const formatDate = timestamp => new Date(timestamp * 1000).toLocaleString("en-US", dateFormatOptions);
        const formatStreak = streak => `${streak.name} ${formatDate(streak.start)} to ${formatDate(streak.end)} (${streak.start}, ${streak.end})`;

        /*console.log('maxWinStreaks');
        for ([discord, streak] of Object.entries(groupStreaks(maxWinStreaks))) {
            console.log(`${streak.name} ${streak.result} ${streak.start} ${streak.end} ${streak.count} ${formatDate(streak.start)} ${formatDate(streak.end)}`);
        }

        console.log('maxLossStreaks');
        for ([discord, streak] of Object.entries(groupStreaks(maxLossStreaks))) {
            console.log(`${streak.name} ${streak.result} ${streak.start} ${streak.end} ${streak.count}`);
        }

        console.log('maxUserWinStreaks');
        for ([discord, streak] of Object.entries(groupStreaks(maxUserWinStreaks))) {
            console.log(`${streak.name} ${streak.result} ${streak.start} ${streak.end} ${streak.count}`);
        }

        console.log('maxUserLossStreaks');
        for ([discord, streak] of Object.entries(groupStreaks(maxUserLossStreaks))) {
            console.log(`${streak.name} ${streak.result} ${streak.start} ${streak.end} ${streak.count}`);
        }*/

        const embed = new MessageEmbed()
            .setTitle(`${seasonal ? 'Season' : 'All-time'} win/loss streaks`)
            .setColor(0xf16a1d)
            .addField(`Longest win streak: ${maxWinCount}`, Object.values(groupStreaks(maxWinStreaks)).map(formatStreak).join('\n'))
            .addField(`Longest loss streak: ${maxLossCount}`, Object.values(groupStreaks(maxLossStreaks)).map(formatStreak).join('\n'))
            .addField(`${member.displayName} longest win streak: ${maxUserWinCount}`, Object.values(groupStreaks(maxUserWinStreaks)).map(formatStreak).join('\n'))
            .addField(`${member.displayName} longest loss streak: ${maxUserLossCount}`, Object.values(groupStreaks(maxUserLossStreaks)).map(formatStreak).join('\n'))
            .addField(`${member.displayName} current streak: ${userCurrentStreak.count} ${userCurrentStreak.result === -1 ? 'loss' : 'win'}`, Object.values(groupStreaks([userCurrentStreak])).map(formatStreak).join('\n'))

        await interaction.editReply({ embeds: [embed] });
    },
};