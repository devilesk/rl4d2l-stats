const { Command } = require('discord.js-commando');
const { Constants } = require('discord.js');
const config = require('../../config');
const msgFromAdmin = require('../../msgFromAdmin');
const logger = require('../../../cli/logger');
const { msgRemainingTimeLeft } = require('../../util');

const msToTime = (s) => {
    const ms = s % 1000;
    s = (s - ms) / 1000;
    const secs = s % 60;
    s = (s - secs) / 60;
    const mins = s % 60;
    const hrs = (s - mins) / 60;

    return `${hrs} hours ${mins} minutes`;
}

class PingScheduleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'pingschedule',
            aliases: [`${config.settings.inhouseRole.toLowerCase()}`],
            group: 'general',
            memberName: 'pingschedule',
            description: `Control when ${config.settings.inhouseRole} is pingable.`,
            args: [
                {
                    key: 'enabled',
                    prompt: 'Turn ping on or off',
                    type: 'string',
                    default: '',
                    validate: (value) => {
                        if (value === 'on' || value == 'off') return true;
                        return `Value must be \`on\` or \`off\``;
                    },
                },
            ],
        });
        
        this.schedule = [[7, 16], [6, 19], [6, 19], [6, 19], [6, 19], [6, 19], [6, 19]];
        this.nextDate = null;
        this.enabled = false;
        this.mentionable = false;
        this.roleUpdateTimer = null;
        this.client.on('ready', async () => this.setNextPingChangeTimer());
        if (this.client.status === Constants.Status.READY) {
            this.setNextPingChangeTimer()
        }
    }
    
    async setRoleMentionable(bMentionable) {
        logger.debug('setRoleMentionable');
        const guild = this.client.guilds.get(config.settings.guild);
        if (guild) {
            const role = guild.roles.find(role => role.name === config.settings.inhouseRole);
            if (role) {
                await role.setMentionable(bMentionable);
                this.mentionable = bMentionable;
                logger.debug(`setRoleMentionable. bMentionable: ${bMentionable}`);
            }
            const channel = guild.channels.find(channel => channel.name === config.settings.inhouseChannel);
            if (channel && (!this.client.messageCache.cache || msgRemainingTimeLeft(this.client.messageCache.cache) === 0)) {
                await channel.setTopic(`${config.settings.inhouseRole} pings are ${bMentionable ? 'enabled' : 'disabled'}. ${this.enabled ? 'Disabling' : 'Enabling'} at ${this.nextDateTimeString()}`);
            }
            logger.debug(`setRoleMentionable. role: ${role} channel: ${channel}`);
        }
    }
    
    async setNextPingChangeTimer() {
        const now = new Date();
        const day = now.getUTCDay();
        const hours = now.getUTCHours();
        
        this.nextDate = new Date();
        this.nextDate.setUTCMinutes(0);
        this.nextDate.setUTCSeconds(0);
        if (hours < this.schedule[day][0]) {
            this.nextDate.setUTCHours(this.schedule[day][0]);
            this.enabled = true;
        }
        else if (hours < this.schedule[day][1]) {
            this.nextDate.setUTCHours(this.schedule[day][1]);
            this.enabled = false;
        }
        else {
            this.nextDate.setUTCDate(this.nextDate.getUTCDate() + 1);
            this.nextDate.setUTCHours(this.schedule[(day + 1) % 7][0]);
            this.enabled = true;
        }
        
        logger.debug(`setNextPingChangeTimer. enabled: ${this.enabled}, nextDate: ${this.nextDate}, timer: ${Math.max(0, this.nextDate - now + 1000)}`);
        
        await this.setRoleMentionable(this.enabled);
        
        this.roleUpdateTimer = setTimeout(async () => this.setNextPingChangeTimer(), Math.max(0, this.nextDate - now + 1000));
    }
    
    nextDateTimeString() {
        return this.nextDate.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', timeZoneName: 'short'});
    }

    async run(msg, { enabled }) {
        if (!enabled) {
            logger.debug(`nextDate: ${this.nextDate} nextDateTimeString: ${this.nextDateTimeString()}, now: ${new Date()}, diff: ${this.nextDate - new Date()}`);
            msg.say(`${config.settings.inhouseRole} pings are ${this.mentionable ? 'enabled' : 'disabled'}. Scheduled to be ${this.enabled ? 'disabled' : 'enabled'} in ${msToTime(Math.max(0, this.nextDate - new Date()))} at ${this.nextDateTimeString()}.`);
        }
        else if (msgFromAdmin(msg)) {
            await this.setRoleMentionable(enabled === 'on');
            msg.say(`${config.settings.inhouseRole} pings turned ${enabled}.`);
        }
    }
}

module.exports = PingScheduleCommand;
