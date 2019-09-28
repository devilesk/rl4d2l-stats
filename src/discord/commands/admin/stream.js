const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const msgFromAdmin = require('../../msgFromAdmin');
const config = require('../../config');
const logger = require('../../../cli/logger');
const got = require('got');
const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');

class StreamCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'stream',
            group: 'admin',
            memberName: 'stream',
            description: 'Add, remove, or list twitch stream live notifications.',
            argsPromptLimit: 0,
            args: [
                {
                    key: 'action',
                    prompt: 'Add, remove or list.',
                    type: 'string',
                    validate: (value) => {
                        if (value === 'add' || value === 'remove' || value === 'list') return true;
                        return 'Action must be `add`, `remove`, or `list`.';
                    },
                },
                {
                    key: 'streamNameOrUrl',
                    prompt: 'Stream name or url.',
                    type: 'string',
                    default: '',
                },
            ],
        });
        
        this.filepath = path.join(__dirname, '../../streamData.json');
        this.subscriptionTimers = {};
        this.loadStreamData().then(() => this.loadSubscriptions());
        
        const processedNotifications = new Set();
        
        const router = new Router();
        
        // subscription verify
        router.get('/', async ctx => {
            logger.debug(JSON.stringify(ctx.request));
            logger.debug(ctx.request.query['hub.challenge']);
            ctx.response.status = 200;
            ctx.body = ctx.request.query['hub.challenge'];
        });
        
        // notification callback
        router.post('/', async ctx => {
            logger.debug(JSON.stringify(ctx.request.body));
            
            for (const guild of client.guilds.array()) {
                for (const channel of guild.channels.array()) {
                    if (channel.id === config.settings.twitchDiscordChannel) {
                        for (const notification of ctx.request.body.data) {
                            if (!processedNotifications.has(notification.id)) {
                                // track notification id so it is only processed once
                                processedNotifications.add(notification.id);
                                
                                // clear tracking after 1 hour to avoid build up
                                setTimeout(() => {
                                    processedNotifications.delete(notification.id);
                                }, 3600000);
                                
                                if (notification.game_id !== '24193' || notification.type !== 'live') continue;
                                
                                // get profile image
                                let profileImageUrl;
                                try {
                                    const userData = await this.requestUserById(notification.user_id);
                                    profileImageUrl = userData.profile_image_url;
                                }
                                catch (e) {
                                    logger.error(e);
                                }
            
                                // create embed
                                const embed = new RichEmbed()
                                    .setAuthor(notification.user_name, profileImageUrl || '', `https://www.twitch.tv/${notification.user_name}`)
                                    .setThumbnail(notification.thumbnail_url.replace('{width}', '80').replace('{height}', '45'))
                                    .setTitle('Now streaming: Left 4 Dead 2')
                                    .setURL(`https://www.twitch.tv/${notification.user_name}`)
                                    .setDescription(notification.title)
                                    .setColor(0x6441a4);

                                return channel.send(`https://www.twitch.tv/${notification.user_name} is streaming L4D2!`, embed);
                            }
                        }

                    }
                }
            }
        });

        const app = new Koa();
        app.use(bodyParser());
        app.use(router.routes());
        this._server = app.listen(config.settings.twitchServerPort);

        logger.debug('Twitch stream notification server running.');
    }

    reload() {
        this._server.close();
        logger.debug('Twitch stream notification server closed.');
        super.reload();
    }

    unload() {
        this._app.close();
        logger.debug('Twitch stream notification server closed.');
        super.unload();
    }

    async loadStreamData() {
        const exists = await fs.pathExists(this.filepath);
        if (exists) {
            logger.info('stream loading data file...');
            this.streamData = await fs.readJson(this.filepath);
        }
        else {
            logger.info('stream data file not exists...');
            this.streamData = {
                subscriptions: {},
            };
            const subscriptions = await this.requestSubscriptionList();
            for (const subscription of subscriptions) {
                const userId = subscription.topic.replace('https://api.twitch.tv/helix/streams?user_id=', '');
                this.streamData.subscriptions[userId] = new Date(subscription.expires_at).getTime();
            }
            await this.saveStreamData();
        }
    }

    async saveStreamData() {
        await fs.writeJson(this.filepath, this.streamData);
    }

    async getAccessToken() {
        if (!this.streamData.accessToken || new Date() >= this.streamData.accessToken.expiration) {
            try {
                const clientId = config.settings.twitchClientId;
                const clientSecret = config.settings.twitchClientSecret;
                const response = await got.post(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, { json: true });
                logger.debug(`getAccessToken response: ${JSON.stringify(response.body)}`);
                this.streamData.accessToken = {
                    token: response.body.access_token,
                    expiration: new Date().getTime() + response.body.expires_in * 1000,
                }
                await this.saveStreamData();
                return this.streamData.accessToken.token;
            }
            catch (e) {
                logger.error(e);
                return null;
            }
        }
        return this.streamData.accessToken.token;
    }

    async requestSubscription(userId, bUnsubscribe) {
        const body = {
            'hub.callback': config.settings.twitchCallback,
            'hub.mode': bUnsubscribe ? 'unsubscribe' : 'subscribe',
            'hub.topic': `https://api.twitch.tv/helix/streams?user_id=${userId}`,
            'hub.lease_seconds': 864000,
            'hub.secret': config.settings.twitchSecret,
        };
        logger.debug(`requestSubscription: ${JSON.stringify(body)}`);
        const accessToken = await this.getAccessToken();
        const response = await got.post('https://api.twitch.tv/helix/webhooks/hub', {
            json: true,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body,
        });
    }

    async requestSubscriptionList() {
        const accessToken = await this.getAccessToken();
        const response = await got('https://api.twitch.tv/helix/webhooks/subscriptions', {
            json: true,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        logger.debug(`requestSubscriptionList response: ${JSON.stringify(response.body)}`);
        return response.body.data;
    }

    async requestUserById(userId) {
        const accessToken = await this.getAccessToken();
        const response = await got(`https://api.twitch.tv/helix/users?id=${userId}`, {
            json: true,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        logger.debug(`requestUserById response: ${JSON.stringify(response.body)}`);
        return response.body.data[0];
    }

    async requestUserByName(streamName) {
        const accessToken = await this.getAccessToken();
        const response = await got(`https://api.twitch.tv/helix/users?login=${streamName}`, {
            json: true,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        logger.debug(`requestUserByName response: ${JSON.stringify(response.body)}`);
        return response.body.data[0];
    }

    async addSubscription(userId) {
        logger.debug(`addSubscription: ${userId}`);
        await this.requestSubscription(userId, false);
        this.streamData.subscriptions[userId] = new Date().getTime() + 864000 * 1000;
        this.addSubscriptionTimer(userId, 864000 * 1000);
        await this.saveStreamData();
    }

    async removeSubscription(userId) {
        logger.debug(`removeSubscription: ${userId}`);
        await this.requestSubscription(userId, true);
        delete this.streamData.subscriptions[userId];
        clearTimeout(this.subscriptionTimers[userId]);
        await this.saveStreamData();
    }

    addSubscriptionTimer(userId, delay) {
        logger.debug(`addSubscriptionTimer. userId: ${userId}, delay: ${delay}`);
        this.subscriptionTimers[userId] = setTimeout(async () => {
            logger.debug(`Renewing subscription for ${userId}...`);
            await this.addSubscription(userId);
        }, delay);
    }

    async loadSubscriptions() {
        logger.debug('loadSubscriptions');
        for (const [userId, expiration] of Object.entries(this.streamData.subscriptions)) {
            this.addSubscriptionTimer(userId, Math.max(0, expiration - new Date()));
        }
    }

    hasPermission(msg) {
        return msgFromAdmin(msg);
    }

    async run(msg, { action, streamNameOrUrl }) {
        // list subscriptions
        if (action === 'list') {
            const subscriptions = await this.requestSubscriptionList();
            
            const embed = new RichEmbed()
                .setTitle('Twitch Stream Subscriptions')
                .setColor(0x6441a4);
            for (const subscription of subscriptions) {
                try {
                    const userId = subscription.topic.replace('https://api.twitch.tv/helix/streams?user_id=', '');
                    const userData = await this.requestUserById(userId);
                    embed.addField(userData.login, `Expires: ${new Date(subscription.expires_at)}`, false);
                }
                catch (e) {
                    logger.error(e);
                    return msg.say('Error creating subscription list.');
                }
            }
            msg.embed(embed);
        }
        // add/remove subscription
        else {
            if (streamNameOrUrl === '') {
                return msg.say('No twitch username or stream link given. Usage: `!stream <add|remove> <twitch username or link>`.');
            }
            
            const streamName = streamNameOrUrl.match(/([^\/]*)\/*$/)[1];
        
            // look up userid
            let userId;
            try {
                const userData = await this.requestUserByName(streamName);
                userId = userData.id;
            }
            catch (e) {
                logger.error(e);
                return msg.say('User lookup error.');
            }
            
            // subscribe/unsubscribe request
            try {
                if (action === 'add') {
                    await this.addSubscription(userId);
                }
                else {
                    await this.removeSubscription(userId);
                }
            }
            catch (e) {
                logger.error(e);
                return msg.say('Add/remove subscription error.');
            }
            
            msg.say('Subscription updated.');
        }
    }
}

module.exports = StreamCommand;
