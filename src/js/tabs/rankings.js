import Handsontable from 'handsontable';
import columns from '../../data/columns';
import { openTooltip, closeTooltip } from '../util/chartTooltip';
import Chart from 'chart.js';
import Promise from 'bluebird';
import BaseTab from './base';
import HandsontableConfig from '../handsontable.config';
import playerLinkRenderer from '../util/playerLinkRenderer';
import findColumnHeader from '../util/findColumnHeader';

class RankingsTab extends BaseTab {
    constructor(App, tabId) {
        super(App, tabId);
        this.tables = {};
        this.ratingChart = {};
        this.chart = null;
    }

    onTabShow() {
        this.tables.combined.render();
        this.tables.trueskill.render();
        this.tables.total.render();
        this.tables.survivor.render();
        this.tables.infected.render();
        this.chart.update();
        this.ratingChart.update();
    }

    async init() {
        const tableOptions = Object.assign({}, HandsontableConfig, {
            data: [],
            colWidths: [150, 100, 100],
            fixedColumnsLeft: 0,
        });

        this.tables.combined = new Handsontable(document.getElementById('table-rankings-combined'), Object.assign({}, tableOptions, {
            columns: [
                {
                    data: 'name',
                    type: 'text',
                    renderer: playerLinkRenderer,
                },
                {
                    data: 'combined',
                    type: 'numeric',
                },
                {
                    data: 'combinedCdf',
                    type: 'numeric',
                },
            ],
            nestedHeaders: [
                [{ label: 'Total with Trueskill', colspan: 3 }],
                ['Name', 'Rating', 'Percentile'],
            ],
        }));

        this.tables.trueskill = new Handsontable(document.getElementById('table-rankings-trueskill'), Object.assign({}, tableOptions, {
            columns: [
                {
                    data: 'name',
                    type: 'text',
                    renderer: playerLinkRenderer,
                },
                {
                    data: 'csr',
                    type: 'numeric',
                },
                {
                    data: 'mu',
                    type: 'numeric',
                },
                {
                    data: 'sigma',
                    type: 'numeric',
                },
            ],
            nestedHeaders: [
                [{ label: 'Trueskill', colspan: 4 }],
                ['Name', 'Rating', 'Mu', 'Sigma'],
            ],
            colWidths: [150, 66, 66, 66],
        }));

        this.tables.total = new Handsontable(document.getElementById('table-rankings-total'), Object.assign({}, tableOptions, {
            columns: [
                {
                    data: 'name',
                    type: 'text',
                    renderer: playerLinkRenderer,
                },
                {
                    data: 'total',
                    type: 'numeric',
                },
                {
                    data: 'totalCdf',
                    type: 'numeric',
                },
            ],
            nestedHeaders: [
                [{ label: 'Total', colspan: 3 }],
                ['Name', 'Rating', 'Percentile'],
            ],
        }));

        this.tables.survivor = new Handsontable(document.getElementById('table-rankings-survivor'), Object.assign({}, tableOptions, {
            columns: [
                {
                    data: 'name',
                    type: 'text',
                    renderer: playerLinkRenderer,
                },
                {
                    data: 'survivor',
                    type: 'numeric',
                },
                {
                    data: 'survivorCdf',
                    type: 'numeric',
                },
            ],
            nestedHeaders: [
                [{ label: 'Survivor', colspan: 3 }],
                ['Name', 'Rating', 'Percentile'],
            ],
        }));

        this.tables.infected = new Handsontable(document.getElementById('table-rankings-infected'), Object.assign({}, tableOptions, {
            columns: [
                {
                    data: 'name',
                    type: 'text',
                    renderer: playerLinkRenderer,
                },
                {
                    data: 'infected',
                    type: 'numeric',
                },
                {
                    data: 'infectedCdf',
                    type: 'numeric',
                },
            ],
            nestedHeaders: [
                [{ label: 'Infected', colspan: 3 }],
                ['Name', 'Rating', 'Percentile'],
            ],
        }));

        this.ratingChart = new Chart(document.getElementById('rankings-rating-chart'), {
            type: 'horizontalBar',
            data: await this.getRankingChartData(this.App.selectedLeagueMatchId, $('input:radio[name="rating_type"]:checked').val()),
            options: {
                plugins: { colorschemes: { scheme: 'brewer.Paired12' } },
                maintainAspectRatio: false,
                legend: { display: false },
                legendCallback: (chart) => {
                    const text = [];
                    text.push(`<div class="d-flex flex-wrap ${chart.id}-legend">`);
                    for (let i = 0; i < chart.data.datasets.length; i++) {
                        text.push(`${'<div class="badge rankings-chart-legend-item" onclick="clickRankingRatingDataset(event, ' + '\''}${chart.legend.legendItems[i].datasetIndex}'` + `)"><div class="rankings-chart-legend-item-marker" style="width:10px;height:10px;display:inline-block;background:${chart.data.datasets[i].backgroundColor}"></div>&nbsp;`);
                        if (chart.data.datasets[i].label) {
                            text.push(chart.data.datasets[i].label);
                        }
                        text.push('</div>');
                    }
                    text.push('</div>');

                    return text.join('');
                },
                scales: {
                    xAxes: [{ stacked: true }],
                    yAxes: [{ stacked: true }],
                },
                tooltips: { mode: 'nearest' },
            },
        });
        this.ratingChart.canvas.parentNode.style.height = `${this.ratingChart.data.labels.length * 25}px`;
        window.ratingChart = this.ratingChart;

        document.getElementById('rankings-rating-chart-legend').innerHTML = this.ratingChart.generateLegend();

        window.clickRankingRatingDataset = (e, datasetIndex) => {
            const index = datasetIndex;
            const ci = e.view.ratingChart;
            const meta = ci.getDatasetMeta(index);

            // See controller.isDatasetVisible comment
            meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
            const o = e.target.classList.contains('rankings-chart-legend-item-marker') ? e.target.parentNode : e.target;
            if (meta.hidden) {
                o.classList.add('inactive');
            }
            else {
                o.classList.remove('inactive');
            }
            ci.update();
        };

        $(document).on('change', 'input:radio[name="rating_type"]', (e) => {
            this.updateRatingChart();
        });

        return Promise.all([
            this.updateTable(),
            this.App.getPlayers().then((players) => {
                this.chart = new Chart.Scatter(document.getElementById('rankings-chart'), {
                    data: {
                        datasets: players.map(player => ({
                            label: player.name,
                            data: [{
                                x: 0,
                                y: 0,
                            }],
                            pointRadius: 7,
                        })),
                        labels: players.map(player => player.name),
                    },
                    options: {
                        plugins: { colorschemes: { scheme: 'brewer.Paired12' } },
                        maintainAspectRatio: false,
                        legend: { display: false },
                        legendCallback: (chart) => {
                            const text = [];
                            text.push(`<div class="d-flex flex-wrap ${chart.id}-legend">`);
                            for (let i = 0; i < chart.data.datasets.length; i++) {
                                text.push(`${'<div class="badge rankings-chart-legend-item" onmouseover="mouseoverDataset(event, ' + '\''}${chart.legend.legendItems[i].datasetIndex}'` + ')" onmouseout="mouseoutDataset(event, ' + `'${chart.legend.legendItems[i].datasetIndex}'` + ')" onclick="clickRankingsDataset(event, ' + `'${chart.legend.legendItems[i].datasetIndex}'` + `)"><div class="rankings-chart-legend-item-marker" style="width:10px;height:10px;display:inline-block;background:${chart.data.datasets[i].backgroundColor}"></div>&nbsp;`);
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
                                    labelString: 'Survivor Rating',
                                },
                            }],
                            yAxes: [{
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Infected Rating',
                                },
                            }],
                        },
                        tooltips: {
                            callbacks: {
                                label(tooltipItem, data) {
                                    const label = data.labels[tooltipItem.datasetIndex];
                                    return [label, `Survivor: ${tooltipItem.xLabel}`, `Infected: ${tooltipItem.yLabel}`];
                                },
                            },
                        },
                    },
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
                    meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
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

                document.getElementById('league-matches-select').addEventListener('change', (e) => {
                    this.App.selectedLeagueMatchId = e.target.value;
                    this.updateTable();
                    this.updateChart();
                    this.updateRatingChart();
                });

                return this.updateChart();
            }),
        ]);
    }

    async updateTable() {
        const leagueData = await this.App.getLeagueData(this.App.selectedLeagueMatchId);
        for (const table of Object.values(this.tables)) {
            table.loadData(leagueData.rankings);
            table.updateSettings({ height: 52 + 24 * leagueData.rankings.length });
            table.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
        }
    }

    async updateChart() {
        const leagueData = await this.App.getLeagueData(this.App.selectedLeagueMatchId);
        this.chart.data = {
            datasets: leagueData.rankings.map(player => ({
                label: player.name,
                data: [{
                    x: player.survivor,
                    y: player.infected,
                }],
                pointRadius: 7,
            })),
            labels: leagueData.rankings.map(player => player.name),
        };
        this.chart.update();
        document.getElementById('rankings-chart-legend').innerHTML = this.chart.generateLegend();
    }

    async updateRatingChart() {
        this.ratingChart.data = await this.getRankingChartData(this.App.selectedLeagueMatchId, $('input:radio[name="rating_type"]:checked').val());
        this.ratingChart.canvas.parentNode.style.height = `${this.ratingChart.data.labels.length * 25}px`;
        this.ratingChart.update();
        document.getElementById('rankings-rating-chart-legend').innerHTML = this.ratingChart.generateLegend();
    }

    async getRankingChartData(matchId, ratingType) {
        const leagueData = await this.App.getLeagueData(matchId);
        const data = {
            datasets: [],
            labels: [],
        };
        const ratingDataset = {
            label: 'Rating',
            stack: 'rating',
            // fill: false,
            // pointRadius: 7,
            // pointHoverRadius: 7,
            // showLine: false,
            // pointStyle: 'rectRot',
            // backgroundColor: 'rgba(0, 0, 0, 0.1)'
        };
        for (const side of this.App.sides) {
            if (ratingType === 'total' || ratingType === side) {
                const totalWeight = columns[side].reduce((acc, col) => acc + (Math.abs(col.weight) || 0), 0);
                const sideData = {
                    datasets: leagueData[side].indNorm.reduce((datasets, stat) => {
                        columns[side].filter(col => (col.data !== 'name' && col.data !== 'steamid' && col.weight)).forEach((col, i) => {
                            datasets[i].data.push(stat[col.data] * col.weight / totalWeight * 100);
                        });
                        return datasets;
                    }, columns[side].filter(col => (col.data !== 'name' && col.data !== 'steamid' && col.weight)).map(col => ({
                        label: findColumnHeader(side, col.data).header,
                        data: [],
                        stack: 'stat',
                    }))),
                    labels: leagueData[side].indTotal.map(row => row.name),
                };
                data.datasets = data.datasets.concat(sideData.datasets);
                data.labels = sideData.labels;
            }
            if (ratingType === side) {
                data.datasets.unshift(Object.assign({}, ratingDataset, { data: leagueData.rankings.map(player => player[side]) }));
            }
        }
        if (ratingType === 'total') {
            data.datasets.unshift(Object.assign({}, ratingDataset, { data: leagueData.rankings.map(player => player.total) }));
        }
        const sortedLabels = data.labels.map((name, i) => ({ name, i })).sort((a, b) => data.datasets[0].data[b.i] - data.datasets[0].data[a.i]);
        data.labels = sortedLabels.map(row => row.name);
        for (let i = 0; i < data.datasets.length; i++) {
            data.datasets[i].data = sortedLabels.map(row => data.datasets[i].data[row.i]);
        }
        return data;
    }
}

export default RankingsTab;
