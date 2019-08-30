const config = require('./config');

const HOUR_MILLISECONDS = 3600000;
const msgHasL4DMention = msg => msg.mentions.roles.find((role) => role.name === config.settings.inhouseRole);
const msgRemainingTimeLeft = msg => Math.max(msg.createdTimestamp + HOUR_MILLISECONDS - Date.now(), 0);

module.exports = {
    HOUR_MILLISECONDS,
    msgHasL4DMention,
    msgRemainingTimeLeft,
}