const { Command } = require('discord.js-commando');
const SteamID = require('steamid');
const connection = require('../../connection');
const config = require('../../config');
const execQuery = require('../../../common/execQuery');
const logger = require('../../../cli/logger');

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

class RegisterCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'register',
            group: 'league',
            memberName: 'register',
            description: 'Link discord with your steam account.',
            argsPromptLimit: 0,
            args: [
                {
                    key: 'steamid',
                    prompt: 'Steam ID',
                    type: 'string',
                },
            ],
        });
    }

    async run(msg, { steamid }) {
        if (config.settings.botChannels.indexOf(msg.channel.name) !== -1) {
            if (await register(msg.author.id, steamid)) {
                return msg.say('You were registered!');
            }

            return msg.say('Use a real steamid! Its somewhere on your steam profile');
        }
    }
}

module.exports = RegisterCommand;
