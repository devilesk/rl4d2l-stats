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
        super.init();
        const playerMapWL = await this.App.getPlayerMapWL();
        this.table = new Handsontable(document.getElementById('records-table'), Object.assign({}, HandsontableConfig, {
            data: playerMapWL.data,
            colHeaders: playerMapWL.headers,
            columns: function (index) {
                if (index > 0) {
                    return { type: 'numeric' }
                }
                else {
                    return {
                        type: 'text',
                        renderer: playerLinkRenderer
                    }
                }
            },
            colWidths: function (index) {
                return index === 0 ? 150 : 50;
            },
            nestedHeaders: playerMapWL.nestedHeaders
        }));
    }
}

export default MapWLTab;