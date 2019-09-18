const { Command } = require('discord.js-commando');
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

    return hrs.toString().padStart(2, '0') + ':' + mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
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
                await channel.setTopic(`${config.settings.inhouseRole} pings are ${bMentionable ? 'enabled' : 'disabled'}.`);
            }
            logger.debug(`setRoleMentionable. role: ${role} channel: ${channel}`);
        }
    }
    
    async setNextPingChangeTimer() {
        const now = new Date();
        const day = now.getDay();
        const hours = now.getHours();
        
        this.nextDate = new Date();
        this.nextDate.setMinutes(0);
        this.nextDate.setSeconds(0);
        if (hours < this.schedule[day][0]) {
            this.nextDate.setHours(this.schedule[day][0]);
            this.enabled = true;
        }
        else if (hours < this.schedule[day][1]) {
            this.nextDate.setHours(this.schedule[day][1]);
            this.enabled = false;
        }
        else {
            this.nextDate.setDate(this.nextDate.getDate() + 1);
            this.nextDate.setHours(this.schedule[(day + 1) % 7][0]);
            this.enabled = true;
        }
        
        logger.debug(`setNextPingChangeTimer. enabled: ${this.enabled}, nextDate: ${this.nextDate}, timer: ${Math.max(0, this.nextDate - now + 1000)}`);
        
        await this.setRoleMentionable(this.enabled);
        
        this.roleUpdateTimer = setTimeout(async () => this.setNextPingChangeTimer(), Math.max(0, this.nextDate - now + 1000));
    }

    async run(msg, { enabled }) {
        if (!enabled) {
            msg.say(`${config.settings.inhouseRole} pings are ${this.mentionable ? 'enabled' : 'disabled'}. Scheduled to be ${this.enabled ? 'disabled' : 'enable'} in ${msToTime(Math.max(0, this.nextDate - new Date()))}.`);
        }
        else if (msgFromAdmin(msg)) {
            await this.setRoleMentionable(enabled === 'on');
            msg.say(`${config.settings.inhouseRole} pings turned ${enabled}.`);
        }
    }
}

module.exports = PingScheduleCommand;
