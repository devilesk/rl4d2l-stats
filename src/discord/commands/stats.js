const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../config');
const logger = require('../../cli/logger');
const { MessageEmbed } = require('discord.js');
const connection = require('../connection');
const playerStatsQuery = require('../playerStatsQuery');
const execQuery = require('../../common/execQuery');

const playerExists = async (discordID) => {
    const { results } = await execQuery(connection, 'SELECT * FROM players WHERE discord=?', [discordID]);
    return results.length ? results[0] : null;
};

const calculateWL = (player) => {
    let wl;
    const w = player.wins;
    const l = player.loses;
    if (w > 0 && l === 0) {
        wl = `100% | ${w}/0`;
    }
    else if (player.wins === 0) {
        wl = `0% | 0/${l}`;
    }
    else {
        const per = (w / (w + l) * 100).toFixed(2);
        wl = `${per} | ${w}/${l}`;
    }
    return wl;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Must be registered using `/register` to view stats.')
        .addStringOption(option =>
            option.setName('range')
                .setDescription('Stats range')
                .addChoice('Season', 'season')
                .addChoice('All', 'all')),
    async execute(interaction) {
        const { guild, channel, member } = interaction;

        if (config.settings.botChannels.indexOf(channel.name) === -1) {
            await interaction.reply({ content: 'Command cannot be used in this channel.', ephemeral: true });
            return;
        }

        await interaction.deferReply();
        
        const statsRange = interaction.options.getString('range') || 'season';
        const seasonal = statsRange === 'season';
        const bPlayerExists = await playerExists(member.id);
        logger.info(`Stats command. statsRange: ${statsRange}. playerExists ${bPlayerExists}`);

        if (!bPlayerExists) {
            await interaction.editReply({ content: 'You were not found! Link your steamid with: !register <steamid>', ephemeral: true });
            return;
        }

        const { results } = await execQuery(connection, playerStatsQuery(member.id, seasonal));

        if (!results.length) {
            await interaction.editReply({ content: 'No stats found. Have you played any matches?', ephemeral: true });
            return;
        }

        const player = results[0];
        const rounds = player.round;

        const embed = new MessageEmbed()
            // Set the title of the field
            .setTitle(`${seasonal ? 'Season' : 'Lifetime'} stats for ${member.displayName}`)
            .setURL(config.strings.statsUrl)
            // Set the color of the embed
            .setColor(0x04B404)
            // Set the main content of the embed
            .addField('Win % | W/L:', calculateWL(player), true)
            .addField('Total Rounds:', `${player.round}`, true)
            .addField('Shotgun Accuracy:', `${player.shotgunAcc.toFixed(2)}%`, true)
            .addField('SMG Accuracy:', `${player.smgAcc.toFixed(2)}%`, true)
            .addField('Pistol Accuracy:', `${player.pistolAcc.toFixed(2)}%`, true)
            .addField('CI Kills:', `${player.kills}`, true)
            .addField('CI Kills/Round:', (player.kills / rounds).toFixed(2), true)
            .addField('SI Dmg/Round:', (player.sidmg / rounds).toFixed(2), true)
            .addField('Tank Dmg/Round:', (player.tankdmg / rounds).toFixed(2), true)
            .addField('% of Tank/Round:', `${(((player.tankdmg / 6000) * 100) / rounds).toFixed(2)}%`, true)
            .addField('FF Given/Round:', (player.ff_given / rounds).toFixed(2), true)
            .addField('FF Taken/Round:', (player.ff_taken / rounds).toFixed(2), true)
            .addField('Downs/Round:', (player.times_down / rounds).toFixed(2), true)
            .addField('Infected Dmg/Round:', (player.infdmg / rounds).toFixed(2), true)
            .addField('Multi Charges:', `${player.multi_charge}`, true)
            .addField('Multi Booms:', `${player.multi_booms}`, true);

        await interaction.editReply({ embeds: [embed] });
    },
};