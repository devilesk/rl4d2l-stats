const { Command } = require('discord.js-commando');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const Promise = require('bluebird');
const fs = require('fs-extra');
const msgFromAdmin = require('../../msgFromAdmin');
const config = require('../../config');
const connection = require('../../connection');
const execQuery = require('../../../common/execQuery');
const { findInArray } = require('../../../common/util');
const createPaste = require('../../pastebin');
const logger = require('../../../cli/logger');

class Spreadsheet {
    constructor(config) {
        this.spreadsheetKey = config.spreadsheetKey;
        this.privateKey = config.privateKey;
        this.clientEmail = config.clientEmail;
        this.link = config.link;
    }
    
    async login() {
        if (!this.doc) {
            this.doc = new GoogleSpreadsheet(this.spreadsheetKey);
            await this.doc.useServiceAccountAuth({
                client_email: this.clientEmail,
                private_key: this.privateKey,
            });
            await this.doc.loadInfo();
        }
    }
    
    getSheet(sheetTitle) {
        return this.doc.sheetsByIndex.find(sheet => sheet.title === sheetTitle);
    }
}

class TankOrderCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'tankorder',
            group: 'league',
            memberName: 'tankorder',
            description: 'Updates the tank order config on the server with the tank order spreadsheet data. Lists the tank order for a campaign',
            argsPromptLimit: 0,
            args: [
                {
                    key: 'updateOrCampaignName',
                    prompt: '`update` or `<campaign name>`',
                    type: 'string',
                    validate: (value) => {
                        if (value === 'update' || this.findCampaign(value)) return true;
                        return `Unknown campaign name. Valid campaign: ${this.campaigns.join(', ')}`;
                    },
                },
                {
                    key: 'captain',
                    prompt: 'Captain name',
                    type: 'string',
                    default: '',
                    validate: (value) => {
                        if (value === '' || this.findCaptain(value)) return true;
                        return `Unknown captain name. Valid captain: ${this.captains.join(', ')}`;
                    },
                },
            ],
        });
        
        this.ready = false;
        this.initSheet();
    }
    
    async initSheet() {
        this.spreadsheet = new Spreadsheet(config.settings.tankOrder);
        await this.spreadsheet.login();
        this.ready = true;
        this.cfgSheet = this.spreadsheet.getSheet(config.settings.tankOrder.cfgSheetName);
        this.dataSheet = this.spreadsheet.getSheet(config.settings.tankOrder.dataSheetName);

        await this.dataSheet.loadCells('B1:F1');
        this.captains = [];
        for (let i = 1; i < 6; i++) {
            const cell = this.dataSheet.getCell(0, i);
            this.captains.push(cell.value);
        }

        await this.dataSheet.loadCells('A2:A69');
        this.maps = [];
        for (let i = 1; i < 69; i++) {
            const cell = this.dataSheet.getCell(i, 0);
            this.maps.push(cell.value);
        }

        const campaigns = {};
        for (const map of this.maps) {
            const campaignName = map.replace(' / 1st Tank', '').replace(' / 2nd Tank', '').slice(0, -2);
            campaigns[campaignName] = 1;
        }
        this.campaigns = Object.keys(campaigns);
        logger.debug(`TankOrder spreadsheet init. captains: ${this.captains}. maps: ${this.maps.length}. campaigns: ${this.campaigns}`);
    }
    
    findCampaign(value) {
        return findInArray(this.campaigns, value);
    }
    
    findCaptain(value) {
        return findInArray(this.captains, value);
    }
    
    getCampaignFirstMapRow(campaignName) {
        for (let i = 0; i < this.maps.length; i++) {
            if (this.maps[i].startsWith(campaignName)) return i + 2;
        }
        return -1;
    }
    
    getCaptainColumn(captain) {
        for (let i = 0; i < this.captains.length; i++) {
            if (this.captains[i] === captain) return i + 1;
        }
        return -1;
    }

    async run(msg, { updateOrCampaignName, captain }) {
        if (msg.channel.name === config.settings.inhouseChannel || config.settings.botChannels.indexOf(msg.channel.name) !== -1) {
            if (!this.ready) return msg.say('Spreadsheet not ready.');
            
            if (updateOrCampaignName === 'update') {
                if (!msgFromAdmin(msg)) return;

                await this.cfgSheet.loadCells('A1:A');
                const values = [];
                for (let i = 0; i < 68; i++) {
                    const cell = this.cfgSheet.getCell(i, 0);
                    values.push(cell.value);
                }

                logger.debug(`${config.settings.tankOrder.cfgSheetName} cell total: ${values.length}`);
                const data = values.join('\n');
                await fs.writeFile(config.settings.tankOrder.cfgFilePath, data);
                const { results } = await execQuery(connection, 'SELECT name, steamid FROM players');
                let reportData = data;
                for (const row of results) {
                    reportData = reportData.replace(new RegExp(row.steamid, 'g'), row.name);
                }
                const pastebinResult = await createPaste(reportData);
                return msg.say(`Tank order config updated. Confirmation report: <${pastebinResult.error ? pastebinResult.error : pastebinResult.link}>`);
            }
            /*else if (updateOrCampaignName !== '') {
                const campaignName = this.findCampaign(updateOrCampaignName);
                const captainName = this.findCaptain(captain);
                const minRow = this.getCampaignFirstMapRow(campaignName);
                const maxRow = minRow + 4;
                let minCol = 1;
                let maxCol = 8;
                const cells = await this.spreadsheet.getCells(this.dataSheet, {
                    'return-empty': true,
                    'min-row': minRow,
                    'max-row': maxRow,
                    'min-col': minCol,
                    'max-col': maxCol,
                });
                const rowLen = maxRow - minRow + 1;
                const colLen = maxCol - minCol + 1;
                const col = this.getCaptainColumn(captainName);
                const values = [];
                for (let r = 0; r < rowLen; r++) {
                    values.push(`${cells[r * colLen].value}: ${cells[r * colLen + col].value || 'N/A'}`);
                }
                msg.say(`${captainName}'s ${campaignName} tank order:\n` + values.join('\n'));
            }*/
        }
    }
}

module.exports = TankOrderCommand;
