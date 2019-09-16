const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
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
            description: 'Add or remove a twitch stream live notification.',
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
        
        this.accessToken = null;
        
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
                                
                                processedNotifications.add(notification.id);
                                
                                if (notification.game_id !== '24193' || notification.type !== 'live') continue;
                                
                                // get profile image
                                let profileImageUrl;
                                try {
                                    if (!this.accessToken) {
                                        const clientId = config.settings.twitchClientId;
                                        const clientSecret = config.settings.twitchClientSecret;
                                        const response = await got.post(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, { json: true });
                                        logger.debug(JSON.stringify(response.body));
                                        this.accessToken = response.body.access_token;
                                    }
                                    const response = await got(`https://api.twitch.tv/helix/users?id=${notification.user_id}`, {
                                        json: true,
                                        headers: {
                                            'Authorization': `Bearer ${this.accessToken}`,
                                        },
                                    });
                                    logger.debug(JSON.stringify(response.body));
                                    profileImageUrl = response.body.data[0].profile_image_url;
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
        app.listen(3011);

        logger.debug('Twitch stream notification server running');
    }

    hasPermission(msg) {
        return msgFromAdmin(msg);
    }

    async run(msg, { action, streamNameOrUrl }) {
        const clientId = config.settings.twitchClientId;
        const clientSecret = config.settings.twitchClientSecret;
        
        // get access token
        try {
            const response = await got.post(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, { json: true });
            logger.debug(JSON.stringify(response.body));
            this.accessToken = response.body.access_token;
        }
        catch (e) {
            logger.error(e);
            return msg.say('Authentication error.');
        }
        
        // list subscriptions
        if (action === 'list') {
            const response = await got('https://api.twitch.tv/helix/webhooks/subscriptions', {
                json: true,
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                },
            });
            logger.debug(JSON.stringify(response.body));
            
            const embed = new RichEmbed()
                .setTitle('Twitch Stream Notifications')
                .setColor(0x6441a4);
            for (const subscription of response.body.data) {
                try {
                    const userId = subscription.topic.replace('https://api.twitch.tv/helix/streams?user_id=', '');
                    const userResponse = await got(`https://api.twitch.tv/helix/users?id=${userId}`, {
                        json: true,
                        headers: {
                            'Authorization': `Bearer ${this.accessToken}`,
                        },
                    });
                    const userName = userResponse.body.data[0].login;
                    embed.addField(userName, `Expires: ${new Date(subscription.expires_at)}`, false);
                }
                catch (e) {
                    logger.error(e);
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
                const response = await got(`https://api.twitch.tv/helix/users?login=${streamName}`, {
                    json: true,
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                    },
                });
                logger.debug(JSON.stringify(response.body));
                userId = response.body.data[0].id;
            }
            catch (e) {
                logger.error(e);
                return msg.say('User lookup error.');
            }
            
            // subscribe/unsubscribe request
            try {
                logger.debug(JSON.stringify({
                    callback: config.settings.twitchCallback,
                    mode: action === 'add' ? 'subscribe' : 'unsubscribe',
                    topic: `https://api.twitch.tv/helix/streams?user_id=${userId}`,
                    lease_seconds: 864000,
                    secret: config.twitchSecret,
                }));
                const response = await got('https://api.twitch.tv/helix/webhooks/hub', {
                    json: true,
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: {
                        'hub.callback': config.settings.twitchCallback,
                        'hub.mode': action === 'add' ? 'subscribe' : 'unsubscribe',
                        'hub.topic': `https://api.twitch.tv/helix/streams?user_id=${userId}`,
                        'hub.lease_seconds': 864000,
                        'hub.secret': config.twitchSecret,
                    },
                });
                logger.debug(JSON.stringify(response.body));
            }
            catch (e) {
                logger.error(e);
                return msg.say('Add/remove error.');
            }
        }
        
        msg.say('Done.');
    }
}

module.exports = StreamCommand;
