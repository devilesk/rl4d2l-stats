const dotenv = require('dotenv');

const envConfig = dotenv.config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' });
const {
    Discord,
    Client,
    RichEmbed,
    Collection,
} = require('discord.js');
const Promise = require('bluebird');
const { exec } = require('child_process');
const execQuery = require('../common/execQuery.js');
const formatDate = require('../common/formatDate');
const getGeneratedTeams = require('./teamgen');
const MessageCache = require('./messageCache');
const mysql = require('mysql');
const SteamID = require('steamid');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../cli/logger');
const playerStatsQuery = require('./playerStatsQuery');
const topStats = require('./topStats');

const client = new Client();

let settings;
let strings;

const mergeObjects = (a, b) => {
    for (const [key, value] of Object.entries(b)) {
        if (typeof value === 'object') {
            a[key] = mergeObjects(a[key] || {}, b[key]);
        }
        else {
            a[key] = value;
        }
    }
    return a;
}

const loadStrings = async () => {
    logger.info('Loading bot strings...');
    settings = await fs.readJson(path.join(__dirname, '../../strings.default.json'));
    const exists = await fs.pathExists(path.join(__dirname, '../../strings.json'));
    if (exists) {
        const settingsOverrides = await fs.readJson(path.join(__dirname, '../../strings.json'));
        mergeObjects(settings, settingsOverrides);
    }
    strings = settings.strings;
};

const execPromise = (command) => new Promise(((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
        if (error) {
            reject(error);
            return;
        }
        resolve(stdout.trim());
    });
}));

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});
connection.connect();

//
// Helper functions
//

const playerExists = async (discordID) => {
    const { results } = await execQuery(connection, 'SELECT * FROM players WHERE discord=?', [discordID]);
    return results.length ? results[0] : null;
};

const playerExistsBySteam = async (steamid) => {
    const { results } = await execQuery(connection, 'SELECT * FROM players WHERE steamid=?', [steamid]);
    return results.length ? results[0] : null;
};

const msgFromAdmin = (msg) => {
    const user = msg.author;
    const member = msg.guild.member(user);
    if (member) return member.roles.some((role) => settings.adminRoles.indexOf(role.name) !== -1);
    return false;
}

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

const pingDatabase = async () => {
    return execQuery(connection, 'SELECT 1');
};

const messageCache = new MessageCache();

// when a message less than an hour old that pings L4D role gets 8 reactions, then bot will ping all reactors.
const processReactions = async (msg) => {
    if (await messageCache.isValidMessage(msg, settings.inhouseRole)) {
        const users = msg.reactions.reduce((acc, reaction) => (acc === null ? reaction.users.clone() : acc.concat(reaction.users)), new Collection());
        logger.info(`processing message with ${users.size} reacts...`);
        if (users.filter((user) => user.id !== client.user.id).size < 8 && !users.has(client.user.id)) {
            await msg.channel.setTopic(`${users.size} ${users.size === 1 ? 'react' : 'reacts'}. React here to play: https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`);
        }
        // check if 8 reacts and if bot has not reacted to message
        if (users.size === 8 && !users.has(client.user.id)) {
            logger.info('8 reactions detected...');
            await msg.react('✅'); // bot reacts to message to prevent pinging reactors again if reactions change later
            await msg.channel.send(users.array().join(' '), await getGeneratedTeams(process.env.DATA_DIR, connection, users.map(user => user.id)));
            await msg.channel.setTopic('');
            messageCache.uncacheMessage(msg);
        }
    }
}

//
// Events
//

client.on('messageReactionAdd', async (msgReaction, user) => processReactions(msgReaction.message));

client.on('messageReactionRemove', async (msgReaction, user) => processReactions(msgReaction.message));

// track messages that ping L4D role
client.on('message', async (msg) => messageCache.isValidMessage(msg, settings.inhouseRole));

client.on('error', logger.error);

client.on('ready', async () => {
    await loadStrings();
    await messageCache.load(client, settings);
    const cachedMessage = await messageCache.getCachedMessage(client);
    if (cachedMessage) {
        await processReactions(cachedMessage);
    }
    logger.info(`Logged in as ${client.user.tag}!`);
    setInterval(pingDatabase, 60000);
});

//
// Message Handling
//

const lastPlayedMapsQuery = `SELECT b.campaign as campaign, MAX(a.startedAt) as startedAt
FROM matchlog a
JOIN maps b
ON a.map = b.map
GROUP BY b.campaign
ORDER BY MAX(a.startedAt) DESC;`;

client.on('message', async (msg) => {
    const splitStr = msg.content.split(' ');

    if (msg.channel.name === settings.inhouseChannel || settings.botChannels.indexOf(msg.channel.name) !== -1) {
        // displays results from team generator spreadsheet
        if (splitStr[0].startsWith('!team')) {
            await msg.channel.send(await getGeneratedTeams(process.env.DATA_DIR, connection));
        }
        // displays list of maps and last played date from matches spreadsheet
        else if (splitStr[0].startsWith('!map')) {
            const { results } = await execQuery(connection, lastPlayedMapsQuery);
            const embed = new RichEmbed()
                .setTitle('Maps')
                .setColor(0x20F622);
            const title = 'Last Played Date | Map';
            const content = results.map(row => `\`${formatDate(new Date(row.startedAt * 1000)).slice(0, -6).padEnd(10, ' ')} | ${row.campaign}\``).join('\n');
            embed.addField(title, content, false);
            await msg.channel.send(embed);
        }
        // display connect link to servers
        else if (splitStr[0].startsWith('!server')) {
            await msg.channel.send(strings.server);
        }
        // display connect link to steam group
        else if (splitStr[0] === '!steamgroup') {
            await msg.channel.send(strings.steamgroup);
        }
        // display download links for custom campaigns
        else if (splitStr[0].startsWith('!custom')) {
            const embed = new RichEmbed()
                .setTitle(strings.customcampaigns.title)
                .setDescription(strings.customcampaigns.description)
                .setColor(0xa10e90);
            for (const entry of strings.customcampaigns.fields) {
                embed.addField(entry[0], entry[1], false);
            }
            await msg.channel.send(embed);
        }
    }
    if (settings.botChannels.indexOf(msg.channel.name) !== -1) {
        //
        // Stats
        //

        if (splitStr[0] === '!stats') {
            const bPlayerExists = await playerExists(msg.author.id);
            if (bPlayerExists) {
                const { results } = await execQuery(connection, playerStatsQuery(msg.author.id));
                const player = results[0];
                const rounds = player.round;

                const embed = new RichEmbed()
                    // Set the title of the field
                    .setTitle(`Info for ${msg.author.tag}`)
                    .setURL(strings.statsUrl)
                    // Set the color of the embed
                    .setColor(0x04B404)
                    // Set the main content of the embed
                    .addField('Win % | W/L:', calculateWL(player), true)
                    .addField('Total Rounds:', player.round, true)
                    .addField('Shotgun Accuracy:', `${player.shotgunAcc.toFixed(2)}%`, true)
                    .addField('SMG Accuracy:', `${player.smgAcc.toFixed(2)}%`, true)
                    .addField('Pistol Accuracy:', `${player.pistolAcc.toFixed(2)}%`, true)
                    .addField('CI Kills:', player.kills, true)
                    .addField('CI Kills/Round:', (player.kills / rounds).toFixed(2), true)
                    .addField('SI Dmg/Round:', (player.sidmg / rounds).toFixed(2), true)
                    .addField('Tank Dmg/Round:', (player.tankdmg / rounds).toFixed(2), true)
                    .addField('% of Tank/Round:', `${(((player.tankdmg / 6000) * 100) / rounds).toFixed(2)}%`, true)
                    .addField('FF Given/Round:', (player.ff_given / rounds).toFixed(2), true)
                    .addField('FF Taken/Round:', (player.ff_taken / rounds).toFixed(2), true)
                    .addField('Downs/Round:', (player.times_down / rounds).toFixed(2), true)
                    .addField('Infected Dmg/Round:', (player.infdmg / rounds).toFixed(2), true)
                    .addField('Multi Charges:', player.multi_charge, true)
                    .addField('Multi Booms:', player.multi_booms, true);

                await msg.channel.send(embed);
            }
            else {
                await msg.reply('You were not found! Link your steamid with: !register <steamid>');
            }
        }

        //
        // Register
        //
        else if (splitStr[0] === '!register') {
            if (await register(msg.author.id, splitStr[1])) {
                await msg.reply('You were registered!');
            }
            else {
                await msg.reply('Use a real steamid! Its somewhere on your steam profile');
            }
        }

        //
        //	Restart (Role access required)
        //	/etc/init.d/srcds1 restart <server #>
        // 	There are 2 servers 1 and 2
        //
        else if (splitStr[0] === '!restart') {
            if (msgFromAdmin(msg)) {
                if (splitStr[1] == null || splitStr[2] == null || splitStr.length < 2) {
                    await msg.reply('!restart <server # 1, 2, or 3> <server type inhouse or league>');
                }
                else {
                    let serverType = 'inhouse';
                    let serverNum = '1';
                    if (splitStr[1] === '2') {
                        serverNum = '2';
                    }
                    else if (splitStr[1] === '3') {
                        serverNum = '3';
                    }
                    if (splitStr[2] === 'league') {
                        serverType = 'league';
                    }

                    try {
                        let stdout;
                        const mapCfgCmd = `/home/map_cfgs.sh ${serverType}`;
                        stdout = await execPromise(mapCfgCmd);
                        logger.info(`stdout: ${stdout}`);
                        await msg.channel.send(`Set server ${serverNum} to ${serverType} configuration.`);

                        const restartCmd = `/etc/init.d/srcds1 restart ${serverNum}`;
                        stdout = await execPromise(restartCmd);
                        logger.info(`stdout: ${stdout}`);
                        await msg.channel.send(`Restarting server ${serverNum}...`);
                    }
                    catch (e) {
                        logger.error(e);
                        await msg.channel.send('Restart failed.');
                    }
                }
            }
        }
        // reload strings json
        else if (splitStr[0] === '!reload') {
            if (msgFromAdmin(msg)) {
                await loadStrings();
                await msg.channel.send('Settings reloaded!');
            }
        }

        //
        // Top players
        //
        else if (splitStr[0] === '!top') {
            const embed = new RichEmbed()
                .setTitle('Top stats (Need to play 20 or more rounds)')
                .setColor(0x000dff);

            for (const topStat of topStats) {
                const { results } = await execQuery(connection, topStat.query);
                const str = results.map(topStat.format).join('\n');
                embed.addField(topStat.title, str, true);
            }
            
            await msg.channel.send(embed);
        }
        else if (splitStr[0] === '!help' || splitStr[0] === '!commands') {
            await msg.channel.send(strings.help);
        }
    }
});

client.login(process.env.TOKEN);
