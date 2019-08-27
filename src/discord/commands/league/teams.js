const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const getGeneratedTeams = require('../../teamgen');
const connection = require('../../connection');
const config = require('../../config');

const isPlayersArgStatRangeArg = text => text.split(',').length === 1 && (text.startsWith('season') || text.startsWith('all'));

class TeamsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'teams',
            aliases: ['team', 'teamgen', 'teamgenerator'],
            group: 'league',
            memberName: 'teams',
            description: 'Display top 5 closest team matchups from team generator.',
            args: [
                {
                    key: 'players',
                    prompt: 'Players',
                    type: 'string',
                    default: '',
                    validate: text => {
                        if (isPlayersArgStatRangeArg(text)) return true;
                        if (text.split(',').length === 8) return true;
                        return 'Enter 8 comma-separated player names';
                    }
                },
                {
                    key: 'statsRange',
                    prompt: 'Stats Range',
                    type: 'string',
                    default: 'season',
                    validate: text => {
                        if (text.startsWith('season') || text.startsWith('all')) return true;
                        return 'Stats range must be season or all';
                    }
                },
            ],
        });
    }
    
    async run(msg, { players, statsRange }) {
        const seasonal = isPlayersArgStatRangeArg(players) ? players.startsWith('season') : statsRange.startsWith('season');
        if (msg.channel.name === config.settings.inhouseChannel || config.settings.botChannels.indexOf(msg.channel.name) !== -1) {
            return msg.embed(await getGeneratedTeams(process.env.DATA_DIR, connection, null, players.split(','), seasonal, false));
        }
    }
};

module.exports = TeamsCommand;