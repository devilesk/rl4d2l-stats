import Handsontable from 'handsontable';
import columns from '../../data/columns';
import findColumnHeader from '../util/findColumnHeader';
import Chart from 'chart.js';
import BaseTab from './base';
import HandsontableConfig from '../handsontable.config';

class LeagueTab extends BaseTab {
    constructor(App, tabId) {
        super(App, tabId);
        this.tables = {};
        this.charts = {};
    }
    
    onTabShow() {
        for (const side of this.App.sides) {
            this.tables[side].render();
            this.charts[side].update();
        }
    }
    
    async getLeagueTableData(matchId, side) {
        const leagueData = await this.App.getLeagueData(matchId);
        return leagueData[side][this.App.statType];
    }
    
    async getLeagueChartData(matchId, side) {
        const leagueData = await this.App.getLeagueData(matchId);
        return {
            datasets: leagueData[side][this.App.statType].reduce((datasets, stat) => {
                this.App.selectedColumns[side].filter(col => (col !== 'name' && col !== 'steamid')).forEach((col, i) => {
                    datasets[i].data.push(stat[col]);
                });
                return datasets;
            }, this.App.selectedColumns[side].filter(col => (col !== 'name' && col !== 'steamid')).map(col => {
                return {
                    label: findColumnHeader(side, col).header,
                    data: []
                }
            })),
            labels: leagueData[side].indTotal.map(row => row.name)
        }
    }
    
    async init() {
        const self = this;
        for (const side of this.App.sides) {
            this.tables[side] = new Handsontable(document.getElementById('table-'+side), Object.assign({}, HandsontableConfig, {
                data: await this.getLeagueTableData(this.App.selectedLeagueMatchId, side),
                colHeaders: this.App.getTableHeaders(side).filter(col => !col.startsWith('Round - ')),
                columns: this.App.getTableColumns(side).filter(col => col.data !== 'round'),
                colWidths: function(index) {
                    return index === 0 ? 150 : 100;
                }
            }));
                        
            this.charts[side] = new Chart(document.getElementById(side+'-chart'), {
                type: 'bar',
                data: await this.getLeagueChartData(this.App.selectedLeagueMatchId, side),
                options: {
                    plugins: {
                        colorschemes: {
                            scheme: 'brewer.Paired12'
                        }
                    },
                    maintainAspectRatio: false,
                    legend: {
                        display: false
                    },
                    legendCallback: chart => {
                        const text = [];
                        text.push('<div class="d-flex flex-wrap ' + chart.id + '-legend">');
                        for (let i = 0; i < chart.data.datasets.length; i++) {
                            text.push('<div class="badge ' + side + '-chart-legend-item" onclick="clickLeagueDataset(event, ' + '\'' + chart.legend.legendItems[i].datasetIndex + '\'' + ')"><div class="' + side + '-chart-legend-item-marker" style="width:10px;height:10px;display:inline-block;background:' + chart.data.datasets[i].backgroundColor + '"></div>&nbsp;');
                            if (chart.data.datasets[i].label) {
                                text.push(chart.data.datasets[i].label);
                            }
                            text.push('</div>');
                        }
                        text.push('</div>');

                        return text.join('');
                    },
                    scales: {
                        xAxes: [{
                            stacked: true,
                        }],
                        yAxes: [{
                            stacked: true
                        }]
                    }
                }
            });
            
            document.getElementById(side+'-chart-legend').innerHTML = this.charts[side].generateLegend();
        }
        
        // stat columns toggle click handler
        this.App.on('columnChanged', side => {
            this.updateLeagueTable(this.App.selectedLeagueMatchId, side);
            this.updateLeagueChart(side);
        });
        
        // side change handler
        this.App.on('sideChanged', side => {
            self.updateLeagueTable(this.App.selectedLeagueMatchId, side);
            self.updateLeagueChart(side);
        });

        // stat type change handler
        $(document).on('change', 'input:radio[name="stat_type"]', function (event) {
            self.App.statType = $(this).val();
            self.updateLeagueTable(self.App.selectedLeagueMatchId, self.App.selectedSide);
            self.updateLeagueChart(self.App.selectedSide);
        });
        
        window.leagueChart = this.charts;
        window.clickLeagueDataset = (e, datasetIndex) => {
            const index = datasetIndex;
            const ci = e.view.leagueChart[this.App.selectedSide];
            const meta = ci.getDatasetMeta(index);

            // See controller.isDatasetVisible comment
            meta.hidden = meta.hidden === null? !ci.data.datasets[index].hidden : null;
            const o = e.target.classList.contains('rankings-chart-legend-item-marker') ? e.target.parentNode : e.target;
            if (meta.hidden) {
                o.classList.add('inactive');
            }
            else {
                o.classList.remove('inactive');
            }
            ci.update();
        };
        
        document.getElementById('league-matches-select').addEventListener('change', e => {
            this.App.selectedLeagueMatchId = e.target.value;
            this.updateLeagueTable(this.App.selectedLeagueMatchId, this.App.selectedSide);
            this.updateLeagueChart(this.App.selectedSide);
        });
    }
    
    async updateLeagueTable(matchId, side) {
        this.App.selectedColumns[side] = Array.from(document.querySelectorAll(`input[name=${side}-columns]:checked`)).map(function (el) { return el.value });
        const leagueData = await this.getLeagueTableData(matchId, side);
        this.tables[side].loadData(leagueData);
        this.tables[side].updateSettings({
            colHeaders: this.App.getTableHeaders(side).filter(col => !col.startsWith('Round - ')),
            columns: this.App.getTableColumns(side).filter(col => col.data !== 'round'),
        });
    }
    
    async updateLeagueChart(side) {
        this.charts[side].data = await this.getLeagueChartData(this.App.selectedLeagueMatchId, side);
        this.charts[side].update();
        document.getElementById(side+'-chart-legend').innerHTML = this.charts[side].generateLegend();
    }
}

export default LeagueTab;