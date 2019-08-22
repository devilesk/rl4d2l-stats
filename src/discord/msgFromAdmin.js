const config = require('./config');

const msgFromAdmin = (msg) => {
    const user = msg.author;
    const member = msg.guild.member(user);
    if (member) return member.roles.some((role) => config.settings.adminRoles.indexOf(role.name) !== -1);
    return false;
}

module.exports = msgFromAdmin;