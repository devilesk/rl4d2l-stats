import Handsontable from 'handsontable';
import Promise from 'bluebird';
import BaseTab from './base';
import HandsontableConfig from '../handsontable.config';
import playerLinkRenderer from '../util/playerLinkRenderer';

class MatchupsTab extends BaseTab {
    constructor(App, tabId) {
        super(App, tabId);
        this.table = null;
    }

    onTabShow() {
        document.title = this.getFullTitle();
        this.table.render();
        $('.matchup_type-options').hide();
        $(`.matchup_type-${this.App.matchupType}`).show();
    }

    async init() {
        document.title = this.getFullTitle();
        const self = this;
        const matrixData = await this.getTableData();
        this.table = new Handsontable(document.getElementById('matchups-table'), Object.assign({}, HandsontableConfig, {
            data: matrixData.data,
            colHeaders: matrixData.headers,
            columns(index) {
                if (index > 0) {
                    return { className: 'text-center' };
                }

                return {
                    type: 'text',
                    renderer: playerLinkRenderer,
                };
            },
            colWidths(index) {
                return index === 0 ? 150 : 100;
            },
            beforeColumnSort(currentSortConfig, destinationSortConfigs) {
                if (self.App.wlStatType === 'wl' && (self.App.matchupType === 'with' || self.App.matchupType === 'against')) {
                    const columnSortPlugin = this.getPlugin('columnSorting');

                    columnSortPlugin.setSortConfig(destinationSortConfigs);

                    const parseWL = str => str.split('-').map(o => parseInt(o) || 0);

                    let newData;
                    if (destinationSortConfigs.length) {
                        const sortConfig = destinationSortConfigs[0];
                        const col = sortConfig.column;
                        newData = this.getData().sort((a, b) => {
                            let c = a; let
                                d = b;
                            if (sortConfig.sortOrder === 'asc') {
                                c = b, d = a;
                            }
                            const c1 = parseWL(c[col]);
                            const d1 = parseWL(d[col]);
                            const c2 = c1[0] / (c1[0] + c1[1]);
                            const d2 = d1[0] / (d1[0] + d1[1]);
                            if (c2 > d2) {
                                return 1;
                            }
                            if (c2 < d2) {
                                return -1;
                            }

                            if (c[col] && !d[col]) {
                                return 1;
                            }
                            if (!c[col] && d[col]) {
                                return -1;
                            }
                            return c1[0] - d1[0];
                        });
                    }
                    else {
                        newData = this.getData().sort((a, b) => a[0].localeCompare(b[0]));
                    }

                    this.loadData(newData);

                    return false;
                }

                return true;
            },
        }));

        // stat season change handler
        this.App.on('seasonTypeChanged', (seasonType) => {
            this.updateTable();
        });

        // wl stat type change handler
        $(document).on('change', 'input:radio[name="wl_stat_type"]', function (event) {
            self.App.wlStatType = $(this).val();
            self.updateTable();
        });

        // dmg aggregation type change handler
        $(document).on('change', 'input:radio[name="dmg_aggr_type"]', function (event) {
            self.App.dmgAggregationType = $(this).val();
            self.updateTable();
        });

        // matchup type change handler
        $(document).on('change', 'input:radio[name="matchup_type"]', function (event) {
            self.App.matchupType = $(this).val();
            self.updateTable();
            $('.matchup_type-options').hide();
            $(`.matchup_type-${self.App.matchupType}`).show();
        });

        $('.matchup_type-options').hide();
        $(`.matchup_type-${this.App.matchupType}`).show();
    }

    async getTableData() {
        const [wlMatrix, damageMatrix] = await Promise.all([
            this.App.getWlMatrix(),
            this.App.getDamageMatrix(),
        ]);
        switch (this.App.matchupType) {
        case 'with':
        case 'against':
            return { data: wlMatrix[this.App.matchupType].data[this.App.wlStatType], headers: wlMatrix[this.App.matchupType].headers };
            break;
        case 'pvp_ff':
        case 'pvp_infdmg':
            return { data: damageMatrix[this.App.matchupType].data[this.App.dmgAggregationType], headers: damageMatrix[this.App.matchupType].headers };
            break;
        }
    }

    async updateTable() {
        const matrixData = await this.getTableData();
        this.table.loadData(matrixData.data);
        this.table.updateSettings({ colHeaders: matrixData.headers });
    }
}

export default MatchupsTab;
