const { Collection } = require('discord.js');
const logger = require('../cli/logger');
const config = require('./config');
const getGeneratedTeams = require('./teamgen');
const connection = require('./connection');
const { msgHasL4DMention, msgRemainingTimeLeft } = require('./util');
const { Mutex } = require('async-mutex');
const { exec } = require('child_process');
const execQuery = require('../common/execQuery');
const lastPlayedMapsQuery = require('./lastPlayedMapsQuery');
const formatDate = require('../common/formatDate');

let savedUsers = new Collection();
const mutex = new Mutex();

const execPromise = command => new Promise(((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
        if (error) {
            reject(error);
            return;
        }
        resolve(stdout.trim());
    });
}));

// when a message less than an hour old that pings L4D role gets 8 reactions, then bot will ping all reactors.
const processReactions = (client, messageCache) => async (msg) => {
    if (msg.channel.name !== config.settings.inhouseChannel) return;

    if (msgHasL4DMention(msg)) {

        // don't concurrently process reactions to L4D message to avoid multiple pops
        await mutex.runExclusive(async () => {
            let users = await messageCache.fetchMessageReactionUsers(msg); // fetch users because msg.reactions not updated when admin removes a react
            if (!users.has(client.user.id)) { // check if bot has not reacted to message

                if (msgRemainingTimeLeft(msg) > 0) {
                    if (messageCache.isLatest(msg)) {

                        // bot reacts to message to prevent pinging reactors again if reactions change later
                        if (users.size >= 8) {
                            await msg.react('✅');
                        }

                        logger.info(`processing message ${msg.id} with ${users.size} reacts...`);
                        if (users.size < 8) {
                            savedUsers = users.clone();
                            await messageCache.cacheMessage(msg);
                        }
                        else {
                            logger.debug(`${users.size} reactions detected... ${Array.from(users.mapValues(user => user.id).values()).join(',')}`);

                            // if more than 8 users, then randomly select among last users.
                            if (users.size > 8) {
                                logger.debug(`${savedUsers.size} savedUsers: ${Array.from(savedUsers.mapValues(user => user.id).values()).join(',')}`);
                                const lastUsers = users.filter(user => !savedUsers.has(user.id));
                                const randomUsers = lastUsers.random(8 - savedUsers.size);
                                logger.debug(`randomly selected ${Array.from(randomUsers.map(user => user.id).values()).join(',')} from ${Array.from(lastUsers.mapValues(user => user.id).values()).join(',')}`);
                                users = savedUsers.clone();
                                for (const user of randomUsers) {
                                    users.set(user.id, user);
                                }
                            }

                            const embed = await getGeneratedTeams(process.env.DATA_DIR, connection, users.map(user => user.id), null, true, true);
                            const numberReacts = ['1⃣', '2⃣', '3⃣'];
                            const gameMsg = await msg.channel.send({ content: `${Array.from(users.mapValues(user => `${user}`).values()).join(' ')} Vote to restart a server by reacting to the corresponding ${numberReacts.join(', ')} on this message. If 4 or more players react within the next 5 minutes, then the corresponding server will be restarted.`, embeds: [embed] });
                            const gameUsers = Array.from(users.mapValues(user => user.id).values());
                            for (let i = 0; i < numberReacts.length; i++) {
                                const numberReact = numberReacts[i];
                                const serverNum = i + 1;
                                await gameMsg.react(numberReact);
                                const filter = (reaction, user) => reaction.emoji.name === numberReact && gameUsers.indexOf(user.id) !== -1;
                                const collector = gameMsg.createReactionCollector({ filter, time: 5 * 60 * 1000 });
                                collector.on('collect', async (reaction, user) => {
                                    logger.debug(`${user.username} reacted ${reaction.emoji.name} to vote to restart ${serverNum}. ${collector.total} total votes.`);
                                    if (collector.total >= 4) {
                                        collector.stop();
                                        const restartCmd = `/etc/init.d/srcds1 restart ${serverNum}`;
                                        const stdout = await execPromise(restartCmd);
                                        logger.info(`${Array.from(users.mapValues(user => user.username).values()).join(',')} vote restarted server ${serverNum}`);

                                        const { results } = await execQuery(connection, lastPlayedMapsQuery(config.settings.ignoredCampaigns));
                                        const nextMap = results.pop();
                                        await msg.channel.send({ content: `Vote passed. Restarting server ${serverNum}... Next map: ${nextMap.campaign}. Last played: ${formatDate(new Date(nextMap.startedAt * 1000)).slice(0, -6).padEnd(10, ' ')}` });
                                    }
                                });
                                client.restartCollectors.push(collector);
                            }
                            await msg.channel.setTopic(config.strings.server);
                            messageCache.uncacheMessage(msg);
                        }
                    }
                    else {
                        logger.info(`message ${msg.id} not latest`);
                        await msg.react('🚫');
                    }
                }
                else {
                    logger.info(`message ${msg.id} expired with ${users.size} reacts`);

                    await msg.react('🚫');
                    if (messageCache.uncacheMessage(msg)) {
                        msg.channel.guild.client.emit('pingExpired', msg.channel);
                    }
                }
            }
        });
    }
};

module.exports = processReactions;
