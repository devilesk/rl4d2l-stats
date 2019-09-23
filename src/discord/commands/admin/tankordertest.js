const { Command } = require('discord.js-commando');
const Promise = require('bluebird');
const fs = require('fs-extra');
const msgFromAdmin = require('../../msgFromAdmin');
const config = require('../../config');
const connection = require('../../connection');
const execQuery = require('../../../common/execQuery');
const logger = require('../../../cli/logger');

const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        // eslint-disable-next-line no-param-reassign
        array[i] = array[j];
        // eslint-disable-next-line no-param-reassign
        array[j] = temp;
    }
};

const data = `static_tank_control 1 c1m1_hotel "TEAM_0_0" "TEAM_1_0"
static_tank_control 1 c1m2_streets "TEAM_0_1" "TEAM_1_1"
static_tank_control 1 c1m3_mall "TEAM_0_2" "TEAM_1_2"
static_tank_control 1 c1m4_atrium "TEAM_0_3" "TEAM_1_3"
static_tank_control 2 c1m4_atrium "TEAM_0_4" "TEAM_1_4"
static_tank_control 1 c2m1_highway "TEAM_0_0" "TEAM_1_0"
static_tank_control 1 c2m2_fairgrounds "TEAM_0_1" "TEAM_1_1"
static_tank_control 1 c2m3_coaster "TEAM_0_2" "TEAM_1_2"
static_tank_control 1 c2m4_barns "TEAM_0_3" "TEAM_1_3"
static_tank_control 1 c2m5_concert "TEAM_0_4" "TEAM_1_4"
static_tank_control 1 c3m1_plankcountry "TEAM_0_0" "TEAM_1_0"
static_tank_control 1 c3m2_swamp "TEAM_0_1" "TEAM_1_1"
static_tank_control 1 c3m3_shantytown "TEAM_0_2" "TEAM_1_2"
static_tank_control 1 c3m4_plantation "TEAM_0_3" "TEAM_1_3"
static_tank_control 2 c3m4_plantation "TEAM_0_4" "TEAM_1_4"
static_tank_control 1 c5m1_waterfront "TEAM_0_0" "TEAM_1_0"
static_tank_control 1 c5m2_park "TEAM_0_1" "TEAM_1_1"
static_tank_control 1 c5m3_cemetery "TEAM_0_2" "TEAM_1_2"
static_tank_control 1 c5m4_quarter "TEAM_0_3" "TEAM_1_3"
static_tank_control 1 c5m5_bridge "TEAM_0_4" "TEAM_1_4"
static_tank_control 1 c8m1_apartment "TEAM_0_0" "TEAM_1_0"
static_tank_control 1 c8m2_subway "TEAM_0_1" "TEAM_1_1"
static_tank_control 1 c8m3_sewers "TEAM_0_2" "TEAM_1_2"
static_tank_control 1 c8m4_interior "TEAM_0_3" "TEAM_1_3"
static_tank_control 1 c8m5_rooftop "TEAM_0_4" "TEAM_1_4"
static_tank_control 1 c10m1_caves "TEAM_0_0" "TEAM_1_0"
static_tank_control 1 c10m2_drainage "TEAM_0_1" "TEAM_1_1"
static_tank_control 1 c10m3_ranchhouse "TEAM_0_2" "TEAM_1_2"
static_tank_control 1 c10m4_mainstreet "TEAM_0_3" "TEAM_1_3"
static_tank_control 1 c10m5_houseboat "TEAM_0_4" "TEAM_1_4"
static_tank_control 1 c11m1_greenhouse "TEAM_0_0" "TEAM_1_0"
static_tank_control 1 c11m2_offices "TEAM_0_1" "TEAM_1_1"
static_tank_control 1 c11m3_garage "TEAM_0_2" "TEAM_1_2"
static_tank_control 1 c11m4_terminal "TEAM_0_3" "TEAM_1_3"
static_tank_control 1 c11m5_runway "TEAM_0_4" "TEAM_1_4"
static_tank_control 1 c12m1_hilltop "TEAM_0_0" "TEAM_1_0"
static_tank_control 1 c12m2_traintunnel "TEAM_0_1" "TEAM_1_1"
static_tank_control 1 c12m3_bridge "TEAM_0_2" "TEAM_1_2"
static_tank_control 1 c12m4_barn "TEAM_0_3" "TEAM_1_3"
static_tank_control 1 c12m5_cornfield "TEAM_0_4" "TEAM_1_4"
static_tank_control 1 dprm1_milltown_a "TEAM_0_0" "TEAM_1_0"
static_tank_control 1 dprm2_sugarmill_a "TEAM_0_1" "TEAM_1_1"
static_tank_control 1 dprm3_sugarmill_b "TEAM_0_2" "TEAM_1_2"
static_tank_control 1 dprm4_milltown_b "TEAM_0_3" "TEAM_1_3"
static_tank_control 1 dprm5_milltown_escape "TEAM_0_4" "TEAM_1_4"
static_tank_control 1 l4d2_diescraper1_apartment_361 "TEAM_0_0" "TEAM_1_0"
static_tank_control 1 l4d2_diescraper2_streets_361 "TEAM_0_1" "TEAM_1_1"
static_tank_control 1 l4d2_diescraper3_mid_361 "TEAM_0_2" "TEAM_1_2"
static_tank_control 1 l4d2_diescraper4_top_361 "TEAM_0_3" "TEAM_1_3"
static_tank_control 2 l4d2_diescraper4_top_361 "TEAM_0_4" "TEAM_1_4"
static_tank_control 1 l4d2_stadium1_apartment "TEAM_0_0" "TEAM_1_0"
static_tank_control 1 l4d2_vs_stadium2_riverwalk "TEAM_0_1" "TEAM_1_1"
static_tank_control 1 l4d2_stadium3_city1 "TEAM_0_2" "TEAM_1_2"
static_tank_control 1 l4d2_stadium4_city2 "TEAM_0_3" "TEAM_1_3"
static_tank_control 1 l4d2_stadium5_stadium "TEAM_0_4" "TEAM_1_4"`;

class TankOrderTestCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'tankordertest',
            group: 'admin',
            memberName: 'tankordertest',
            description: 'Updates the tank order staging config on the server with random tank assignments.',
        });
        
    }
    
    hasPermission(msg) {
        return msgFromAdmin(msg);
    }
    
    async run(msg, content) {
        if (msg.channel.name === config.settings.inhouseChannel || config.settings.botChannels.indexOf(msg.channel.name) !== -1) {
            if (content.indexOf(' vs ') === -1) {
                msg.say('Invalid teams input. Example: `!tankordertest Gofu,Roragok,Matieu,Autoattacks vs Wicket,Osis,BMTS,AwfulWaffle`');
                return;
            }
            const players = content.replace(' vs ', ',').split(',');
            const { results } = await execQuery(connection, `SELECT name, steamid FROM players WHERE name IN (${players.map(player => "'" + player + "'").join(',')})`);
            const steamIdMap = {};
            for (const row of results) {
                steamIdMap[row.name] = row.steamid;
            }
            for (const player of players) {
                if (!steamIdMap[player]) {
                    msg.say(`Unknown player: ${player}. (Name must appear as it does on the website)`);
                    return;
                }
            }
            logger.debug(JSON.stringify(steamIdMap));
            const teams = content.split(' vs ').map(team => team.split(','));
            let tankOrderCfg = data;
            for (let i = 0; i < 2; i++) {
                const team = teams[i];
                shuffle(team);
                team.push(team[Math.floor(Math.random()*team.length)]);
                for (let j = 0; j < 5; j++) {
                    const player = team[j];
                    const steamId = steamIdMap[player];
                    
                    tankOrderCfg = tankOrderCfg.replace(new RegExp(`TEAM_${i}_${j}`, 'g'), steamId);
                }
            }
            await fs.writeFile(config.settings.tankOrderTestCfgFilePath, tankOrderCfg);
            msg.say('Staging config updated with randomized tank order.');
        }
    }
}

module.exports = TankOrderTestCommand;
