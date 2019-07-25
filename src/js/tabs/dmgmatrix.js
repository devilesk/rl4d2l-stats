import Handsontable from 'handsontable';
import BaseTab from './base';

class DamageMatrixTab extends BaseTab {
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
        const damageMatrix = await this.App.getDamageMatrix();
        this.table = new Handsontable(document.getElementById('dmgmatrix-chart'), {
            licenseKey: 'non-commercial-and-evaluation',
            data: damageMatrix[this.App.dmgType].data[this.App.dmgAggregationType],
            columns: function (index) {
                return {
                    type: index > 0 ? 'numeric' : 'text'
                }
            },
            fixedColumnsLeft: 1,
            rowHeaders: true,
            colHeaders: damageMatrix[this.App.dmgType].headers,
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

        // dmg type change handler
        $(document).on('change', 'input:radio[name="dmg_type"]', function (event) {
            self.App.dmgType = $(this).val();
            self.table.loadData(damageMatrix[self.App.dmgType].data[self.App.dmgAggregationType]);
        });

        // dmg aggregation type change handler
        $(document).on('change', 'input:radio[name="dmg_aggr_type"]', function (event) {
            self.App.dmgAggregationType = $(this).val();
            self.table.loadData(damageMatrix[self.App.dmgType].data[self.App.dmgAggregationType]);
        });
    }
}

export default DamageMatrixTab;