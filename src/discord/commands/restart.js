const { SlashCommandBuilder } = require('@discordjs/builders');
const { exec } = require('child_process');
const config = require('../config');
const logger = require('../../cli/logger');
const connection = require('../connection');
const execQuery = require('../../common/execQuery');
const lastPlayedMapsQuery = require('../lastPlayedMapsQuery');
const formatDate = require('../../common/formatDate');

const execPromise = command => new Promise(((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
        if (error) {
            reject(error);
            return;
        }
        resolve(stdout.trim());
    });
}));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Restart server.')
        .setDefaultPermission(false)
        .addIntegerOption(option => option.setName('servernum').setDescription('Server number')),
    async execute(interaction) {
        const serverNum = interaction.options.getInteger('servernum') || 1;
        const restartCmd = `/etc/init.d/srcds1 restart ${serverNum}`;
        const stdout = await execPromise(restartCmd);
        logger.info(`${interaction.user.username} restarted server ${serverNum}`);

        const { results } = await execQuery(connection, lastPlayedMapsQuery(config.settings.ignoredCampaigns));
        const nextMap = results.pop();
        await interaction.reply({ content: `Restarting server ${serverNum}... Next map: ${nextMap.campaign}. Last played: ${formatDate(new Date(nextMap.startedAt * 1000)).slice(0, -6).padEnd(10, ' ')}` });
    },
};