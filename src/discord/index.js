const dotenv = require('dotenv');

const envConfig = dotenv.config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' });
const { Client, Intents, Collection } = require('discord.js');
const MessageCache = require('./messageCache');
const fs = require('fs-extra');
const logger = require('../cli/logger');
const connection = require('./connection');
const config = require('./config');
const processReactions = require('./processReactions');
const { HOUR_MILLISECONDS, msgRemainingTimeLeft, msgHasL4DMention } = require('./util');
const TwitchStreamNotifications = require('./twitchStreamNotifications');

const messageCache = new MessageCache(config);

config.load().then(() => {
    const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_PRESENCES] });
    client.messageCache = messageCache;

    client.commands = new Collection();
    const commandFiles = fs.readdirSync('./src/discord/commands').filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        logger.info(`Loading command: ${command.data.name}`);
        // Set a new item in the Collection
        // With the key as the command name and the value as the exported module
        client.commands.set(command.data.name, command);
    }

    client.restartCollectors = [];
    const _processReactions = processReactions(client, messageCache);
    client.on('messageReactionAdd', (msgReaction, user) => _processReactions(msgReaction.message).catch(logger.error));
    client.on('messageReactionRemove', (msgReaction, user) => _processReactions(msgReaction.message).catch(logger.error));
    client.on('messageReactionRemoveAll', msg => _processReactions(msg).catch(logger.error));
    client.on('messageDelete', async (msg) => {
        if (messageCache.uncacheMessage(msg)) {
            await msg.channel.setTopic('');
        }
    });
    client.on('messageDeleteBulk', async (msgs) => {
        for (const msg of msgs.values()) {
            if (messageCache.uncacheMessage(msg)) {
                await msg.channel.setTopic('');
            }
        }
    });

    // track messages that ping L4D role
    client.on('messageCreate', async (msg) => {
        try {
            await _processReactions(msg);
        }
        catch (e) {
            logger.error(e);
        }
        if (msgHasL4DMention(msg)) {
            setTimeout(() => _processReactions(msg).catch(logger.error), HOUR_MILLISECONDS); // message ping expiration timer
        }
    });

    client.on('error', logger.error);

    client.on('ready', async () => {
        logger.info(`Logged in as ${client.user.tag}!`);
        /*for (const owner of client.owners) {
            await owner.send(`Logged in as ${client.user.tag}!`);
        }*/

        twitchStreamNotifications = new TwitchStreamNotifications();
        await twitchStreamNotifications.init(client);

        const guild = await client.guilds.fetch(config.settings.guild);
        const commands = await guild.commands.fetch();
        for (const [commandId, command] of commands) {
            logger.info(`Setting permissions for command: ${command.name}`);
            /*if (command.name === 'restart' || command.name === 'stream') {
                const permissions = [
                    {
                        id: config.settings.adminRoleId,
                        type: 'ROLE',
                        permission: true,
                    },
                ];

                await command.permissions.add({ permissions });
            }
            else if (command.name === 'reload') {
                const permissions = [
                    {
                        id: config.settings.owner,
                        type: 'USER',
                        permission: true,
                    },
                ];

                await command.permissions.add({ permissions });
            }*/
        }

        await messageCache.load(client);
        if (messageCache.cache) {
            try {
                await _processReactions(messageCache.cache);
            }
            catch (e) {
                logger.error(e);
            }
            if (messageCache.cache) { // check if there is still a cached message after processing reactions
                const remainingTimeLeft = msgRemainingTimeLeft(messageCache.cache);
                logger.info(`Cached message remaining time left: ${remainingTimeLeft}`);
                setTimeout(() => {
                    try {
                        if (messageCache.cache) {
                            _processReactions(messageCache.cache);
                        }
                    }
                    catch (e) {
                        logger.error(e);
                    }
                }, remainingTimeLeft); // message ping expiration timer
            }
        }
        logger.info(`Ready!`);
    });

    client.on('shardDisconnect', (event, shardID) => {
        logger.info('Client disconnect');
        process.exit(0);
    });

    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;
        
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            logger.error(error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
            else {
                await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    });

    client.login(config.settings.botToken);
});
