import Handsontable from 'handsontable';
import columns from '../../data/columns';
import { openTooltip, closeTooltip } from '../util/chartTooltip';
import Chart from 'chart.js';
import Promise from 'bluebird';
import BaseTab from './base';
import HandsontableConfig from '../handsontable.config';
import playerLinkRenderer from '../util/playerLinkRenderer';

class RankingsTab extends BaseTab {
    constructor(App, tabId) {
        super(App, tabId);
        this.tables = {};
        this.chart = null;
    }
    
    onTabShow() {
        this.tables.total.render();
        this.tables.survivor.render();
        this.tables.infected.render();
        this.chart.update();
    }
    
    async init() {
        super.init();
        const tableOptions = Object.assign({}, HandsontableConfig, {
            data: [],
            colWidths: [150, 100, 100],
            fixedColumnsLeft: 0
        });
        
        this.tables.total = new Handsontable(document.getElementById('table-rankings-total'), Object.assign({}, tableOptions, {
            columns: [
                {
                    data: 'name',
                    type: 'text',
                    renderer: playerLinkRenderer
                },
                {
                    data: 'total',
                    type: 'numeric'
                },
                {
                    data: 'totalCdf',
                    type: 'numeric'
                }
            ],
            nestedHeaders: [
                [{label: 'Total', colspan: 3}],
                ['Name', 'Rating', 'Percentile']
            ]
        }));
        
        this.tables.survivor = new Handsontable(document.getElementById('table-rankings-survivor'), Object.assign({}, tableOptions, {
            columns: [
                {
                    data: 'name',
                    type: 'text',
                    renderer: playerLinkRenderer
                },
                {
                    data: 'survivor',
                    type: 'numeric'
                },
                {
                    data: 'survivorCdf',
                    type: 'numeric'
                }
            ],
            nestedHeaders: [
                [{label: 'Survivor', colspan: 3}],
                ['Name', 'Rating', 'Percentile']
            ]
        }));
        
        this.tables.infected = new Handsontable(document.getElementById('table-rankings-infected'), Object.assign({}, tableOptions, {
            columns: [
                {
                    data: 'name',
                    type: 'text',
                    renderer: playerLinkRenderer
                },
                {
                    data: 'infected',
                    type: 'numeric'
                },
                {
                    data: 'infectedCdf',
                    type: 'numeric'
                }
            ],
            nestedHeaders: [
                [{label: 'Infected', colspan: 3}],
                ['Name', 'Rating', 'Percentile']
            ]
        }));
        
        return Promise.all([
            this.updateTable(),
            this.App.getPlayers().then(players => {
                this.chart = new Chart.Scatter(document.getElementById('rankings-chart'), {
                    data: {
                        datasets: players.map(player => {
                            return {
                                label: player.name,
                                data: [{
                                    x: 0,
                                    y: 0
                                }]
                            }
                        }),
                        labels: players.map(player => player.name)
                    },
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
                                text.push('<div class="badge rankings-chart-legend-item" onmouseover="mouseoverDataset(event, ' + '\'' + chart.legend.legendItems[i].datasetIndex + '\'' + ')" onmouseout="mouseoutDataset(event, ' + '\'' + chart.legend.legendItems[i].datasetIndex + '\'' + ')" onclick="clickRankingsDataset(event, ' + '\'' + chart.legend.legendItems[i].datasetIndex + '\'' + ')"><div class="rankings-chart-legend-item-marker" style="width:10px;height:10px;display:inline-block;background:' + chart.data.datasets[i].backgroundColor + '"></div>&nbsp;');
                                if (chart.data.labels[i]) {
                                    text.push(chart.data.labels[i]);
                                }
                                text.push('</div>');
                            }
                            text.push('</div>');

                            return text.join('');
                        },
                        scales: {
                            xAxes: [{
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Survivor Rating'
                                }
                            }],
                            yAxes: [{
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Infected Rating'
                                }
                            }]
                        },
                        tooltips: {
                            callbacks: {
                                label: function (tooltipItem, data) {
                                    const label = data.labels[tooltipItem.datasetIndex];
                                    return [label, 'Survivor: ' + tooltipItem.xLabel, 'Infected: ' + tooltipItem.yLabel];
                                }
                            }
                        }
                    }
                });
                
                window.rankingsChart = this.chart;
                window.mouseoutDataset = function (e, datasetIndex) {
                    const index = datasetIndex;
                    const ci = e.view.rankingsChart;
                    const meta = ci.getDatasetMeta(index);

                    if (!meta.hidden) {
                        ci.updateHoverStyle(meta.data, 'point', true);
                        ci.update();
                        closeTooltip(ci, datasetIndex, 0);
                    }
                };
                window.mouseoverDataset = function (e, datasetIndex) {
                    const index = datasetIndex;
                    const ci = e.view.rankingsChart;
                    const meta = ci.getDatasetMeta(index);
                    
                    if (!meta.hidden) {
                        ci.updateHoverStyle(meta.data, 'point', true);
                        ci.draw();
                        openTooltip(ci, datasetIndex, 0);
                    }
                };
                window.clickRankingsDataset = function (e, datasetIndex) {
                    const index = datasetIndex;
                    const ci = e.view.rankingsChart;
                    const meta = ci.getDatasetMeta(index);

                    // See controller.isDatasetVisible comment
                    meta.hidden = meta.hidden === null? !ci.data.datasets[index].hidden : null;
                    const o = e.target.classList.contains('rankings-chart-legend-item-marker') ? e.target.parentNode : e.target;
                    if (meta.hidden) {
                        o.classList.add('inactive');
                        closeTooltip(ci, datasetIndex, 0);
                        ci.update();
                    }
                    else {
                        o.classList.remove('inactive');
                        ci.update();
                        openTooltip(ci, datasetIndex, 0);
                    }
                };
                
                document.getElementById('league-matches-select').addEventListener('change', e => {
                    this.App.selectedLeagueMatchId = e.target.value;
                    this.updateTable();
                    this.updateChart();
                });
                
                return this.updateChart();
            })
        ]);
    }
    
    async updateTable() {
        const leagueData = await this.App.getLeagueData(this.App.selectedLeagueMatchId);
        for (const table of Object.values(this.tables)) {
            table.loadData(leagueData.rankings);
            table.updateSettings({
                height: 52 + 24 * leagueData.rankings.length
            });
            table.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
        }
    }
    
    async updateChart() {
        const leagueData = await this.App.getLeagueData(this.App.selectedLeagueMatchId);
        this.chart.data = {
            datasets: leagueData.rankings.map(player => {
                return {
                    label: player.name,
                    data: [{
                        x: player.survivor,
                        y: player.infected
                    }]
                }
            }),
            labels: leagueData.rankings.map(player => player.name)
        };
        this.chart.update();
        document.getElementById('rankings-chart-legend').innerHTML = this.chart.generateLegend();
    }
}

export default RankingsTab;