import Handsontable from 'handsontable';
import BaseTab from './base';

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
        this.table = new Handsontable(document.getElementById('records-table'), {
            licenseKey: 'non-commercial-and-evaluation',
            data: playerMapWL.data,
            columns: function (index) {
                return {
                    type: index > 0 ? 'numeric' : 'text'
                }
            },
            rowHeaders: true,
            colHeaders: playerMapWL.headers,
            nestedHeaders: playerMapWL.nestedHeaders,
            columnSorting: {
                indicator: true
            },
            readOnly: true,
            readOnlyCellClassName: '',
            filters: true,
            headerTooltips: {
                rows: false,
                columns: true,
                onlyTrimmed: true
            },
            wordWrap: false,
            colWidths: function (index) {
                return index === 0 ? 150 : 50;
            }
        });
    }
}

export default MapWLTab;