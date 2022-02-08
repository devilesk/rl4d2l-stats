const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const playerStatsQuery = require('../../playerStatsQuery');
const connection = require('../../connection');
const config = require('../../config');
const execQuery = require('../../../common/execQuery');

const playerExists = async (discordID) => {
    const { results } = await execQuery(connection, 'SELECT * FROM players WHERE discord=?', [discordID]);
    return results.length ? results[0] : null;
};

const calculateWL = (player) => {
    let wl;
    const w = player.wins;
    const l = player.loses;
    if (w > 0 && l === 0) {
        wl = `100% | ${w}/0`;
    }
    else if (player.wins === 0) {
        wl = `0% | 0/${l}`;
    }
    else {
        const per = (w / (w + l) * 100).toFixed(2);
        wl = `${per} | ${w}/${l}`;
    }
    return wl;
};

class StatsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'stats',
            group: 'league',
            memberName: 'stats',
            description: 'Must be registered using `!register` to view stats.',
            argsPromptLimit: 0,
            args: [
                {
                    key: 'statsRange',
                    prompt: 'Stats Range',
                    type: 'string',
                    default: 'season',
                    validate: (text) => {
                        if (text.startsWith('season') || text.startsWith('all')) return true;
                        return 'Stats range must be season or all';
                    },
                },
            ],
        });
    }

    async run(msg, { statsRange }) {
        if (config.settings.botChannels.indexOf(msg.channel.name) !== -1) {
            const bPlayerExists = await playerExists(msg.author.id);
            const seasonal = statsRange.startsWith('season');
            if (bPlayerExists) {
                const { results } = await execQuery(connection, playerStatsQuery(msg.author.id, seasonal));
                if (results.length) {
                    const player = results[0];
                    const rounds = player.round;

                    const embed = new MessageEmbed()
                        // Set the title of the field
                        .setTitle(`${seasonal ? 'Season' : 'Lifetime'} stats for ${msg.author.tag}`)
                        .setURL(config.strings.statsUrl)
                        // Set the color of the embed
                        .setColor(0x04B404)
                        // Set the main content of the embed
                        .addField('Win % | W/L:', calculateWL(player), true)
                        .addField('Total Rounds:', player.round, true)
                        .addField('Shotgun Accuracy:', `${player.shotgunAcc.toFixed(2)}%`, true)
                        .addField('SMG Accuracy:', `${player.smgAcc.toFixed(2)}%`, true)
                        .addField('Pistol Accuracy:', `${player.pistolAcc.toFixed(2)}%`, true)
                        .addField('CI Kills:', player.kills, true)
                        .addField('CI Kills/Round:', (player.kills / rounds).toFixed(2), true)
                        .addField('SI Dmg/Round:', (player.sidmg / rounds).toFixed(2), true)
                        .addField('Tank Dmg/Round:', (player.tankdmg / rounds).toFixed(2), true)
                        .addField('% of Tank/Round:', `${(((player.tankdmg / 6000) * 100) / rounds).toFixed(2)}%`, true)
                        .addField('FF Given/Round:', (player.ff_given / rounds).toFixed(2), true)
                        .addField('FF Taken/Round:', (player.ff_taken / rounds).toFixed(2), true)
                        .addField('Downs/Round:', (player.times_down / rounds).toFixed(2), true)
                        .addField('Infected Dmg/Round:', (player.infdmg / rounds).toFixed(2), true)
                        .addField('Multi Charges:', player.multi_charge, true)
                        .addField('Multi Booms:', player.multi_booms, true);

                    return msg.embed(embed);
                }
                return msg.say('No stats found. Have you played any matches?');
            }
            return msg.say('You were not found! Link your steamid with: !register <steamid>');
        }
    }
}

module.exports = StatsCommand;
