import Handsontable from 'handsontable';
import BaseTab from './base';

class WlMatrixTab extends BaseTab {
    constructor(App, tabId) {
        super(App, tabId);
        this.table = null;
    }
    
    onTabShow() {
        this.table.render();
    }
    
    async init() {
        super.init();
        const self = this;
        const wlMatrix = await this.App.getWlMatrix();
        this.table = new Handsontable(document.getElementById('wlmatrix-chart'), {
            licenseKey: 'non-commercial-and-evaluation',
            data: wlMatrix[this.App.wlType].data[this.App.wlStatType],
            columns: function (index) {
                return {
                    className: index > 0 ? 'text-center' : ''
                }
            },
            fixedColumnsLeft: 1,
            rowHeaders: true,
            colHeaders: wlMatrix[this.App.wlType].headers,
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
            colWidths: function (index) {
                return index === 0 ? 150 : 100;
            }
        });

        // wl stat type change handler
        $(document).on('change', 'input:radio[name="wl_stat_type"]', function (event) {
            self.App.wlStatType = $(this).val();
            self.table.loadData(wlMatrix[self.App.wlType].data[self.App.wlStatType]);
        });

        // wl type change handler
        $(document).on('change', 'input:radio[name="wl_type"]', function (event) {
            self.App.wlType = $(this).val();
            self.table.loadData(wlMatrix[self.App.wlType].data[self.App.wlStatType]);
        });
    }
}

export default WlMatrixTab;