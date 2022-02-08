const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../config');
const logger = require('../../cli/logger');
const SteamID = require('steamid');
const connection = require('../connection');
const execQuery = require('../../common/execQuery');

const playerExistsBySteam = async (steamid) => {
    const { results } = await execQuery(connection, 'SELECT * FROM players WHERE steamid=?', [steamid]);
    return results.length ? results[0] : null;
};

/**
 * Registers a user to a database or updates their steamid if already exits
 *
 * Can handle most safety features.
 *
 * Can take in steamid64, steam2id, or shorten id
 * The id used in database is steam2id
 * @param {String} discordID
 * @param {String} steamID
 */
const register = async (discordID, steamID) => {
    if (steamID == null || discordID == null) {
        return false;
    }
    if (steamID.indexOf('STEAM') > -1 || /^[0-9]+$/.test(steamID)) {
        const sid = steamID.length > 10 ? new SteamID(steamID) : SteamID.fromIndividualAccountID(steamID);

        if (!sid.isValid()) {
            return false;
        }

        const renderedID = sid.getSteam2RenderedID(true);

        const player = await playerExistsBySteam(renderedID);
        if (player) {
            logger.info(`register. updating user discord: ${discordID} steamid: ${renderedID}`);
            await execQuery(connection, 'UPDATE players SET discord=? WHERE steamid=?', [discordID, renderedID]);
        }
        else {
            logger.info(`register. inserting user discord: ${discordID} steamid: ${renderedID}`);
            await execQuery(connection, 'INSERT INTO players (discord, steamid) VALUES (?, ?)', [discordID, renderedID]);
        }
        return true;
    }
    return false;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Link discord with your steam account.')
        .addStringOption(option =>
            option.setName('steamid')
                .setRequired(true)
                .setDescription('Steam ID')),
    async execute(interaction) {
        const { guild, channel, member } = interaction;
        logger.info(`Register command`);

        if (config.settings.botChannels.indexOf(channel.name) === -1) return;

        const steamid = interaction.options.getString('steamid');

        if (await register(member.id, steamid)) {
            logger.info(`Registered ${member.displayName} ${member.id} ${steamid}`);
            await interaction.reply({ content: 'You were registered!', ephemeral: true });
            return
        }

        logger.info(`Register failed ${member.displayName} ${member.id} ${steamid}`);
        await interaction.reply({ content: 'Use a real steamid! Its somewhere on your steam profile', ephemeral: true });
    },
};