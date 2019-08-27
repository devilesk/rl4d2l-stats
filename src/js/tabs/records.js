import Handsontable from 'handsontable';
import BaseTab from './base';
import HandsontableConfig from '../handsontable.config';
import playerLinkRenderer from '../util/playerLinkRenderer';

class MapWLTab extends BaseTab {
    constructor(App, tabId) {
        super(App, tabId);
        this.table = null;
    }

    onTabShow() {
        this.table.render();
    }

    async init() {
        const playerMapWL = await this.App.getPlayerMapWL();
        this.table = new Handsontable(document.getElementById('records-table'), Object.assign({}, HandsontableConfig, {
            data: playerMapWL.data,
            columns(index) {
                if (index > 0) {
                    return { type: 'numeric' };
                }

                return {
                    type: 'text',
                    renderer: playerLinkRenderer,
                };
            },
            colWidths(index) {
                return index === 0 ? 150 : 50;
            },
            nestedHeaders: playerMapWL.nestedHeaders,
        }));
        
        // stat season change handler
        this.App.on('seasonTypeChanged', (seasonType) => {
            this.updateTable();
        });
    }
    
    async updateTable() {
        const playerMapWL = await this.App.getPlayerMapWL();
        this.table.loadData(playerMapWL.data);
        this.table.updateSettings({ nestedHeaders: playerMapWL.nestedHeaders });
    }
}

export default MapWLTab;
