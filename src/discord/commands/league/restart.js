const { Command } = require('discord.js-commando');
const SteamID = require('steamid');
const Promise = require('bluebird');
const { exec } = require('child_process');
const msgFromAdmin = require('../../msgFromAdmin');
const connection = require('../../connection');
const config = require('../../config');
const execQuery = require('../../../common/execQuery');
const logger = require('../../../cli/logger');

const execPromise = (command) => new Promise(((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
        if (error) {
            reject(error);
            return;
        }
        resolve(stdout.trim());
    });
}));

class RestartCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'restart',
            group: 'league',
            memberName: 'restart',
            description: 'Restart a server. Requires server admin role',
            args: [
                {
                    key: 'serverNum',
                    prompt: 'Server Number',
                    type: 'integer',
                    default: 1,
                    validate: value => {
                        if (value >= 1 && value <= config.settings.serverCount) return true;
                        return `Server number must be between 1 and ${config.settings.serverCount}`;
                    }
                },
                {
                    key: 'serverType',
                    prompt: 'Server Type',
                    type: 'string',
                    default: 'inhouse',
                    validate: text => {
                        if (text === 'inhouse' || text === 'league') return true;
                        return 'Server type must be inhouse or league';
                    }
                },
            ],
        });
    }
    
    hasPermission(msg) {
        return msgFromAdmin(msg);
    }
    
    async run(msg, { serverNum, serverType }) {
        if (config.settings.botChannels.indexOf(msg.channel.name) !== -1) {
            try {
                let stdout;
                const mapCfgCmd = `/home/map_cfgs.sh ${serverType}`;
                stdout = await execPromise(mapCfgCmd);
                logger.info(`stdout: ${stdout}`);
                await msg.say(`Set server ${serverNum} to ${serverType} configuration.`);

                const restartCmd = `/etc/init.d/srcds1 restart ${serverNum}`;
                stdout = await execPromise(restartCmd);
                logger.info(`stdout: ${stdout}`);
                await msg.say(`Restarting server ${serverNum}...`);
            }
            catch (e) {
                logger.error(e);
                await msg.say('Restart failed.');
            }
        }
    }
};

module.exports = RestartCommand;