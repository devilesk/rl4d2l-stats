const dotenv = require('dotenv');

const envConfig = dotenv.config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' });
const {
    Discord,
    Client,
    RichEmbed,
} = require('discord.js');
const Promise = require('bluebird');
const { exec } = require('child_process');
const execQuery = require('../common/execQuery.js');
const formatDate = require('../common/formatDate');
const getGeneratedTeams = require('./teamgen');
const mysql = require('mysql');
const SteamID = require('steamid');
const fs = require('fs-extra');
const path = require('path');

const client = new Client();

let strings;

const loadStrings = async () => {
    const exists = await fs.pathExists(path.join(__dirname, '../../strings.json'));
    if (exists) {
        strings = await fs.readJson(path.join(__dirname, '../../strings.json'));
    }
    else {
        strings = await fs.readJson(path.join(__dirname, '../../strings.example.json'));
    }
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

const init = async () => {
    await loadStrings();
};

//
// Helper functions
//

// creates message embed with data from team generator spreadsheet
const createTeamGeneratorEmbed = (results) => {
    const embed = new RichEmbed()
        .setTitle('Team Generator')
        .setColor(0x972323);
    for (let i = 0; i < 5; i++) {
        const result = results[i];
        let survivor = 1;
        let infected = 2;
        if (parseFloat(result.stats[1]) < parseFloat(result.stats[2])) {
            survivor = 2;
            infected = 1;
        }
        const title = `Survivor (${result.stats[survivor]}) vs Infected (${result.stats[infected]}) | ${result.stats[0]}`;
        const content = `${result.teams[survivor - 1].join(',')} vs ${result.teams[infected - 1].join(',')}`;
        embed.addField(title, content, false);
    }
    return embed;
};

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
    if (member) return member.roles.some((role) => role.name === 'Server Admins' || role.name === 'bot');
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
            console.log('update');
            await execQuery(connection, 'UPDATE players SET discord=? WHERE steamid=?', [discordID, renderedID]);
        }
        else {
            console.log('insert');
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
    console.log('Keeping database alive...');
    return execQuery(connection, 'SELECT 1');
};

const getPlayerName = (result, members) => {
    if (result.discord) {
        const member = members.get(result.discord);
        if (member) {
            return member.displayName;
        }
    }
    return result.steamid;
};

//
// Events
//

//
// Ready
//

client.on('ready', async () => {
    await init();
    console.log(`Logged in as ${client.user.tag}!`);
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

const playerStatsQuery = discord => `SELECT a.plyCommon as kills,
a.plyHitsShotgun / a.plyShotsShotgun as shotgunAcc,
a.plyHitsSmg / a.plyShotsSmg as smgAcc,
a.plyHitsPistol / a.plyShotsPistol as pistolAcc,
a.plyTankDamage as tankdmg,
a.plySIDamage as sidmg,
a.round as round,
b.infDmgUpright as infdmg,
COALESCE(d.wins, 0) as wins,
COALESCE(e.loses, 0) as loses,
a.plyFFGiven as ff_given,
a.plyFFTaken as ff_taken,
a.plyIncaps as times_down,
b.infMultiBooms as multi_booms,
b.infBooms as booms,
b.infMultiCharges as multi_charge
FROM (
    SELECT steamid,
    SUM(plyCommon) as plyCommon,
    SUM(plyHitsShotgun) as plyHitsShotgun,
    SUM(plyHitsSmg) as plyHitsSmg,
    SUM(plyHitsPistol) as plyHitsPistol,
    SUM(plyShotsShotgun) as plyShotsShotgun,
    SUM(plyShotsSmg) as plyShotsSmg,
    SUM(plyShotsPistol) as plyShotsPistol,
    SUM(plyTankDamage) as plyTankDamage,
    SUM(plySIDamage) as plySIDamage,
    COUNT(*) as round,
    SUM(plyFFGiven) as plyFFGiven,
    SUM(plyFFTaken) as plyFFTaken,
    SUM(plyIncaps) as plyIncaps
    FROM survivor
    GROUP BY steamid
) a
JOIN (
    SELECT steamid,
    SUM(infDmgUpright) as infDmgUpright,
    SUM(infBooms) as infBooms,
    SUM(infMultiCharges) as infMultiCharges,
    SUM(infBoomsDouble + infBoomsTriple + infBoomsQuad) as infMultiBooms
    FROM infected
    GROUP BY steamid
) b
ON a.steamid = b.steamid
JOIN players c
ON a.steamid = c.steamid
LEFT JOIN (
    SELECT steamid, COUNT(*) as wins
    FROM matchlog
    WHERE result = 1
    GROUP BY steamid
) d
ON a.steamid = d.steamid
LEFT JOIN (
    SELECT steamid, COUNT(*) as loses
    FROM matchlog
    WHERE result = -1
    GROUP BY steamid
) e
ON a.steamid = e.steamid
WHERE c.discord = ${discord};`;

client.on('message', async (msg) => {
    const splitStr = msg.content.split(' ');

    if (msg.channel.name === 'general' || msg.channel.name === 'bots' || msg.channel.name === 'test') {
        // displays results from team generator spreadsheet
        if (splitStr[0].startsWith('!team')) {
            await msg.channel.send(await getGeneratedTeams(process.env.DATA_DIR));
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
    if (msg.channel.name === 'bots' || msg.channel.name === 'test') {
        //
        // Stats
        //

        if (splitStr[0] === '!stats') {
            const bPlayerExists = await playerExists(msg.author.id);
            if (bPlayerExists) {
                const { results } = await execQuery(connection, playerStatsQuery(msg.author.id));
                const player = results[0];
                console.log('found');
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
                // Send the embed to the same channel as the message
                await msg.channel.send(embed);
            }
            else {
                await msg.reply('You were not found! Link you steamid with: !register <steamid>');
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
                        console.log(`stdout: ${stdout}`);
                        await msg.channel.send(`Set server ${serverNum} to ${serverType} configuration.`);

                        const restartCmd = `/etc/init.d/srcds1 restart ${serverNum}`;
                        stdout = await execPromise(restartCmd);
                        console.log(`stdout: ${stdout}`);
                        await msg.channel.send(`Restarting server ${serverNum}...`);
                    }
                    catch (e) {
                        console.log(`stderr: ${e}`);
                        await msg.channel.send('Restart failed.');
                    }
                }
            }
        }
        // reload strings json
        else if (splitStr[0] === '!reload') {
            if (msgFromAdmin(msg)) {
                await loadStrings();
                await msg.channel.send('Strings reloaded!');
            }
        }

        //
        // Top players
        //
        else if (splitStr[0] === '!top') {
            const embed = new RichEmbed()
                .setTitle('Top stats (Need to play 20 or more rounds)')
                .setColor(0x000dff);

            // rounds
            {
                const { results } = await execQuery(connection, `SELECT MAX(b.name) as name, a.steamid as steamid, COUNT(*) as round
FROM survivor a
JOIN players b
ON a.steamid = b.steamid
WHERE a.deleted = 0
GROUP BY a.steamid
ORDER BY COUNT(*) DESC
LIMIT 3;`);
                const str = results.map((row) => `${row.name || row.steamid} | ${row.round}`).join('\n');
                embed.addField('Rounds', str, true);
            }

            // shotgun accuracy
            {
                const { results } = await execQuery(connection, `SELECT MAX(b.name) as name, a.steamid as steamid, SUM(a.plyHitsShotgun) / SUM(a.plyShotsShotgun) as accuracy
FROM survivor a
JOIN players b
ON a.steamid = b.steamid
WHERE a.deleted = 0
GROUP BY a.steamid
HAVING COUNT(*) > 19
ORDER BY SUM(a.plyHitsShotgun) / SUM(a.plyShotsShotgun) DESC
LIMIT 3;`);
                const str = results.map((row) => `${row.name || row.steamid} | ${row.accuracy.toFixed(2)}%`).join('\n');
                embed.addField('Best Shotgun Accuracy', str, true);
            }

            // smg accuracy
            {
                const { results } = await execQuery(connection, `SELECT MAX(b.name) as name, a.steamid as steamid, SUM(a.plyHitsSMG) / SUM(a.plyShotsSMG) as accuracy
FROM survivor a
JOIN players b
ON a.steamid = b.steamid
WHERE a.deleted = 0
GROUP BY a.steamid
HAVING COUNT(*) > 19
ORDER BY SUM(a.plyHitsSMG) / SUM(a.plyShotsSMG) DESC
LIMIT 3;`);
                const str = results.map((row) => `${row.name || row.steamid} | ${row.accuracy.toFixed(2)}%`).join('\n');
                embed.addField('Best SMG Accuracy', str, true);
            }

            // pistol accuracy
            {
                const { results } = await execQuery(connection, `SELECT MAX(b.name) as name, a.steamid as steamid, SUM(a.plyHitsPistol) / SUM(a.plyShotsPistol) as accuracy
FROM survivor a
JOIN players b
ON a.steamid = b.steamid
WHERE a.deleted = 0
GROUP BY a.steamid
HAVING COUNT(*) > 19
ORDER BY SUM(a.plyHitsPistol) / SUM(a.plyShotsPistol) DESC
LIMIT 3;`);
                const str = results.map((row) => `${row.name || row.steamid} | ${row.accuracy.toFixed(2)}%`).join('\n');
                embed.addField('Best Pistol Accuracy', str, true);
            }

            // common kills
            {
                const { results } = await execQuery(connection, `SELECT MAX(b.name) as name, a.steamid as steamid, SUM(a.plyCommon) / COUNT(*) as roundkills
FROM survivor a
JOIN players b
ON a.steamid = b.steamid
WHERE a.deleted = 0
GROUP BY a.steamid
HAVING COUNT(*) > 19
ORDER BY SUM(a.plyCommon) / COUNT(*) DESC
LIMIT 3;`);
                const str = results.map((row) => `${row.name || row.steamid} | ${row.roundkills.toFixed(2)}`).join('\n');
                embed.addField('Common Kills/Round', str, true);
            }

            // si dmg
            {
                const { results } = await execQuery(connection, `SELECT MAX(b.name) as name, a.steamid as steamid, SUM(a.plySIDamage) / COUNT(*) as roundsidmg
FROM survivor a
JOIN players b
ON a.steamid = b.steamid
WHERE a.deleted = 0
GROUP BY a.steamid
HAVING COUNT(*) > 19
ORDER BY SUM(a.plySIDamage) / COUNT(*) DESC
LIMIT 3;`);
                const str = results.map((row) => `${row.name || row.steamid} | ${row.roundsidmg.toFixed(2)}`).join('\n');
                embed.addField('SI Dmg/Round', str, true);
            }

            // infected dmg
            {
                const { results } = await execQuery(connection, `SELECT MAX(b.name) as name, a.steamid as steamid, SUM(a.infDmgUpright) / COUNT(*) as roundinfdmg
FROM infected a
JOIN players b
ON a.steamid = b.steamid
WHERE a.deleted = 0
GROUP BY a.steamid
HAVING COUNT(*) > 19
ORDER BY SUM(a.infDmgUpright) / COUNT(*) DESC
LIMIT 3;`);
                const str = results.map((row) => `${row.name || row.steamid} | ${row.roundinfdmg.toFixed(2)}`).join('\n');
                embed.addField('Infected Dmg/Round', str, true);
            }

            // tank dmg
            {
                const { results } = await execQuery(connection, `SELECT MAX(b.name) as name, a.steamid as steamid, SUM(a.plyTankDamage) / COUNT(*) as roundtankdmg
FROM survivor a
JOIN players b
ON a.steamid = b.steamid
WHERE a.deleted = 0
GROUP BY a.steamid
HAVING COUNT(*) > 19
ORDER BY SUM(a.plyTankDamage) / COUNT(*) DESC
LIMIT 3;`);
                const str = results.map((row) => `${row.name || row.steamid} | ${row.roundtankdmg.toFixed(2)}`).join('\n');
                embed.addField('Tank Dmg/Round', str, true);
            }

            // best ff dmg
            {
                const { results } = await execQuery(connection, `SELECT MAX(b.name) as name, a.steamid as steamid, SUM(a.plyFFGiven) / COUNT(*) as roundfriendly_fire
FROM survivor a
JOIN players b
ON a.steamid = b.steamid
WHERE a.deleted = 0
GROUP BY a.steamid
HAVING COUNT(*) > 19
ORDER BY SUM(a.plyFFGiven) / COUNT(*) ASC
LIMIT 3;`);
                const str = results.map((row) => `${row.name || row.steamid} | ${row.roundfriendly_fire.toFixed(2)}`).join('\n');
                embed.addField('Best FFs', str, true);
            }

            // worst ff dmg
            {
                const { results } = await execQuery(connection, `SELECT MAX(b.name) as name, a.steamid as steamid, SUM(a.plyFFGiven) / COUNT(*) as roundfriendly_fire
FROM survivor a
JOIN players b
ON a.steamid = b.steamid
WHERE a.deleted = 0
GROUP BY a.steamid
HAVING COUNT(*) > 19
ORDER BY SUM(a.plyFFGiven) / COUNT(*) DESC
LIMIT 3;`);
                const str = results.map((row) => `${row.name || row.steamid} | ${row.roundfriendly_fire.toFixed(2)}`).join('\n');
                embed.addField('Worst FFs', str, true);
            }

            await msg.channel.send(embed);
        }
        else if (splitStr[0] === '!help' || splitStr[0] === '!commands') {
            await msg.channel.send(`**Bot Commands**

\`!register <steamid>\` - Link discord with your steam account.
\`!stats\` - Must be registered using \`!register\` to view stats.
\`!restart <server number>\` - Restarts the given server. Requires server admin role.
\`!top\` - Display top players for various stats.
\`!teamgenerator\` - Display top 5 closest team matchups from team generator.
\`!maps\` - Display maps with last played date.
\`!servers\` - Display link to servers.
\`!steamgroup\` - Display link to steam group.
\`!customcampaigns\` - Custom campaign download links and installation instructions.
\`!help\` - List of commands.`);
        }
    }
});

// when a message less than an hour old that pings L4D role gets 8 reactions, then bot will ping all reactors.
client.on('messageReactionAdd', async (msgReaction, user) => {
    const msg = msgReaction.message;
    if (Date.now() - msg.createdTimestamp < 3600000) {
        if (msg.mentions.roles.find((role) => role.name === 'L4D')) {
            const users = msg.reactions.reduce((acc, reaction) => (acc === null ? reaction.users.clone() : acc.concat(reaction.users)), null);
            if (users && users.filter((user) => user.id !== client.user.id).size < 8 && !users.has(client.user.id)) {
                await msg.channel.setTopic(`${users.size} ${users.size === 1 ? 'react' : 'reacts'}. React here to play: https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`);
            }
            console.log('reaction to message with role ping', users.size);
            // check if 8 reacts and if bot has reacted to message
            if (users && users.size === 8 && !users.has(client.user.id)) {
                console.log('pinging all reactors');
                // bot reacts to message to prevent pinging reactors again if reactions change later
                await msg.react('✅');
                await msg.channel.send(users.array().join(' '));
                await msg.channel.setTopic('');
                await msg.channel.send(await getGeneratedTeams(process.env.DATA_DIR));
            }
        }
    }
});

client.on('messageReactionRemove', async (msgReaction, user) => {
    const msg = msgReaction.message;
    if (Date.now() - msg.createdTimestamp < 3600000) {
        if (msg.mentions.roles.find((role) => role.name === 'L4D')) {
            const users = msg.reactions.reduce((acc, reaction) => (acc === null ? reaction.users.clone() : acc.concat(reaction.users)), null);
            if (users && users.filter((user) => user.id !== client.user.id).size < 8 && !users.has(client.user.id)) {
                msg.channel.setTopic(`${users.size} ${users.size === 1 ? 'react' : 'reacts'}. React here to play: https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`);
            }
            console.log('unreaction to message with role ping');
        }
    }
});

client.on('error', console.error);

client.login(process.env.TOKEN);
