import columns from '../../data/columns';
import findColumnHeader from '../util/findColumnHeader';
import Promise from 'bluebird';
import Chart from 'chart.js';
import BaseTab from './base';

class ProfileTab extends BaseTab {
    constructor(App, tabId) {
        super(App, tabId);
        this.trendCharts = {};
        this.defaultGetProfileChartData = async chart => ({
            datasets: [{ data: await Promise.map(chart.stats, async stat => this.App.getStatsForPlayer(this.App.selectedSteamId, chart.side, this.App.statType).then(row => row[stat])) }],
            labels: chart.stats.map((stat) => {
                const columnHeader = columns[chart.side].find(c => c.data == stat);
                return columnHeader.header;
            }),
        });
        this.profileCharts = [
            {
                elementId: 'plyWeaponUsage-chart',
                type: 'pie',
                side: 'survivor',
                statType: 'indTotal',
                stats: ['plyShotsShotgun', 'plyShotsSmg', 'plyShotsPistol'],
            },
            {
                elementId: 'plyAccuracy-chart',
                type: 'bar',
                side: 'survivor',
                statType: 'indTotal',
                stats: ['plyShotsShotgun', 'plyShotsSmg', 'plyShotsPistol'],
                getData: async chart => ({
                    datasets: [{
                        label: 'Accuracy',
                        data: await Promise.map(chart.stats, async (stat) => {
                            const row = await this.App.getStatsForPlayer(this.App.selectedSteamId, chart.side, this.App.statType);
                            return Math.round(row[stat.replace('Shots', 'Hits')] / row[stat] * 100) / 100;
                        }),
                    }],
                    labels: chart.stats.map((stat) => {
                        const columnHeader = columns[chart.side].find(c => c.data == stat);
                        return columnHeader.header;
                    }),
                }),
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true,
                                suggestedMax: 1,
                            },
                        }],
                    },
                },
            },
            {
                elementId: 'plyKills-chart',
                type: 'bar',
                side: 'survivor',
                statType: 'indTotal',
                getData: async chart => ({
                    datasets: [
                        {
                            label: 'No Tank',
                            data: await Promise.all([
                                this.App.getStatsForPlayer(this.App.selectedSteamId, chart.side, this.App.statType).then(row => row.plyCommon),
                                this.App.getStatsForPlayer(this.App.selectedSteamId, chart.side, this.App.statType).then(row => row.plySIKilled),
                            ]),
                        },
                        {
                            label: 'During Tank',
                            data: await Promise.all([
                                this.App.getStatsForPlayer(this.App.selectedSteamId, chart.side, this.App.statType).then(row => row.plyCommonTankUp),
                                this.App.getStatsForPlayer(this.App.selectedSteamId, chart.side, this.App.statType).then(row => row.plySIKilledTankUp),
                            ]),
                        },
                    ],
                    labels: ['CI Kills', 'SI Kills'],
                }),
                options: {
                    scales: {
                        xAxes: [{ stacked: true }],
                        yAxes: [{
                            stacked: true,
                            ticks: {
                                beginAtZero: true,
                                suggestedMax: 1,
                            },
                        }],
                    },
                },
            },
            {
                elementId: 'plyDamage-chart',
                type: 'bar',
                side: 'survivor',
                statType: 'indTotal',
                getData: async chart => ({
                    datasets: [
                        {
                            label: 'No Tank',
                            data: await Promise.all([
                                this.App.getStatsForPlayer(this.App.selectedSteamId, chart.side, this.App.statType).then(row => row.plySIDamage),
                            ]),
                        },
                        {
                            label: 'During Tank',
                            data: await Promise.all([
                                this.App.getStatsForPlayer(this.App.selectedSteamId, chart.side, this.App.statType).then(row => row.plySIDamageTankUp),
                                this.App.getStatsForPlayer(this.App.selectedSteamId, chart.side, this.App.statType).then(row => row.plyTankDamage),
                                0,
                            ]),
                        },
                    ],
                    labels: ['SI Damage', 'Tank Damage'],
                }),
                options: {
                    scales: {
                        xAxes: [{ stacked: true }],
                        yAxes: [{
                            stacked: true,
                            ticks: {
                                beginAtZero: true,
                                suggestedMax: 1,
                            },
                        }],
                    },
                },
            },
            {
                elementId: 'plyDamageTaken-chart',
                type: 'pie',
                side: 'survivor',
                statType: 'indTotal',
                stats: ['plyFallDamage', 'plyDmgTaken', 'plyDmgTakenBoom', 'plyDmgTakenCommon', 'plyDmgTakenTank', 'plyFFTaken'],
            },
            {
                elementId: 'infDamage-chart',
                type: 'pie',
                side: 'infected',
                statType: 'indTotal',
                stats: ['infDmgBoom', 'infDmgScratch', 'infDmgSpit', 'infDmgTank', 'infHunterDPDmg'],
            },
            {
                elementId: 'infBooms-chart',
                type: 'pie',
                side: 'infected',
                statType: 'indTotal',
                stats: ['infBoomerPops', 'infBoomsSingle', 'infBoomsDouble', 'infBoomsTriple', 'infBoomsQuad'],
            },
            {
                elementId: 'infSpawns-chart',
                type: 'pie',
                side: 'infected',
                statType: 'indTotal',
                stats: ['infSpawnSmoker', 'infSpawnBoomer', 'infSpawnHunter', 'infSpawnCharger', 'infSpawnSpitter', 'infSpawnJockey'],
            },
        ];
    }

    getTitle() {
        const sel = document.getElementById('players-select');
        return sel.options[sel.selectedIndex].text;
    }

    getRoute() {
        return `${location.pathname}#/${this.tabId.replace('-tab', '')}/${document.getElementById('players-select').value}`;
    }

    onTabShow() {
        document.title = this.getFullTitle();
        for (const side of this.App.sides) {
            this.trendCharts[side].render();
        }
        for (const chart of this.profileCharts) {
            chart.chartObj.update();
        }
    }

    async init() {
        document.title = this.getFullTitle();
        const self = this;

        this.minRange = document.getElementById('profile-match-range').value;
        document.getElementById('profile-match-range').addEventListener('change', (e) => {
            this.minRange = document.getElementById('profile-match-range').value;
            this.updateProfileCharts(this.App.selectedSteamId);
            this.updateProfileTrendCharts();
        });

        await Promise.all([
            Promise.map(this.profileCharts, async (chart) => {
                chart.getData = chart.getData || this.defaultGetProfileChartData;
                chart.chartObj = new Chart(document.getElementById(chart.elementId), {
                    type: chart.type,
                    data: await chart.getData(chart),
                    options: chart.options || { plugins: { colorschemes: { scheme: 'brewer.Paired12' } } },
                });
            }),
            Promise.map(this.App.sides, async (side) => {
                this.trendCharts[side] = new Chart(document.getElementById(`${side}-trend-chart`), {
                    type: 'line',
                    data: await this.getProfileTrendChartData(this.App.selectedSteamId, side),
                    options: {
                        plugins: { colorschemes: { scheme: 'brewer.Paired12' } },
                        maintainAspectRatio: false,
                        scales: {
                            xAxes: [{
                                type: 'time',
                                time: {
                                    parser: 'MM/DD/YYYY HH:mm',
                                    // round: 'day'
                                    tooltipFormat: 'll h:mmA',
                                    displayFormats: { hour: 'MMM D hA' },
                                },
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Matches',
                                },
                            }],
                        },
                    },
                });

                document.getElementById(`profile-${side}-stat`).addEventListener('change', (e) => {
                    this.updateProfileTrendCharts();
                });
            }),
        ]);

        for (const side of this.App.sides) {
            document.getElementById(`${side}-trend-chart`).onclick = function (evt) {
                const pt = self.trendCharts[side].getElementAtEvent(evt)[0];
                if (pt) {
                    const label = self.trendCharts[side].data.labels[pt._index];
                    window.location.href = `#/match/${parseInt(label.getTime() / 1000)}`;
                }
            };
        }

        // stat type change handler
        this.App.on('statTypeChanged', (statType) => {
            this.updateProfileCharts(this.App.selectedSteamId);
            this.updateProfileTrendCharts();
        });

        // player change handler
        this.App.on('playerChanged', (steamId) => {
            document.getElementById('profile-match-range').value = 0;
            this.minRange = 0;
            this.updateProfileCharts(this.App.selectedSteamId);
            this.updateProfileTrendCharts();
        });
    }

    async refresh() {
        if (!this.initialized) {
            this.initialized = this.init();
        }
        else {
            await this.initialized;
            this.updateProfileCharts(this.App.selectedSteamId);
            this.updateProfileTrendCharts();
        }
    }

    async getProfileTrendChartData(steamId, side) {
        const stat = document.getElementById(`profile-${side}-stat`).value;
        const playerData = await this.App.getPlayerData(steamId);
        const single = playerData ? playerData.single[side][this.App.statType].map(row => row[stat]) : [];
        const cumulative = playerData ? playerData.cumulative[side][this.App.statType].map(row => row[stat]) : [];
        const recent = playerData ? playerData.recent[side][this.App.statType].map(row => row[stat]) : [];
        const labels = playerData ? playerData.single[side][this.App.statType].map(row => new Date(row.matchId * 1000)) : [];
        const col = findColumnHeader(side, stat);

        if (single.length != document.getElementById('profile-match-range').max) {
            document.getElementById('profile-match-range').max = single.length - 1;
        }
        if (document.getElementById('profile-match-range').value > parseInt(document.getElementById('profile-match-range').max)) {
            document.getElementById('profile-match-range').value = 0;
            this.minRange = 0;
        }

        return {
            datasets: [
                {
                    label: col.header,
                    fill: false,
                    data: single.slice(this.minRange),
                    showLine: false,
                    pointRadius: 7,
                },
                {
                    label: (this.App.statType === 'indTotal' || col.data === 'plyTotalRounds' || col.data === 'infTotalRounds' ? 'Cumulative' : 'Cumulative Moving Average'),
                    fill: false,
                    data: cumulative.slice(this.minRange),
                    pointRadius: 7,
                },
                {
                    label: (this.App.statType === 'indTotal' || col.data === 'plyTotalRounds' || col.data === 'infTotalRounds' ? 'Cumulative (Last 5)' : 'Moving Average'),
                    fill: false,
                    data: recent.slice(this.minRange),
                    pointRadius: 7,
                },
            ],
            labels: labels.slice(this.minRange),
        };
    }

    async updateProfileTrendCharts() {
        return Promise.map(this.App.sides, async (side) => {
            this.trendCharts[side].data = await this.getProfileTrendChartData(this.App.selectedSteamId, side);
            this.trendCharts[side].update();
        });
    }

    async updateProfileCharts() {
        return Promise.map(this.profileCharts, async (chart) => {
            const chartObj = chart.chartObj;
            if (chartObj) {
                chartObj.data = await chart.getData(chart);
                chartObj.update();
            }
        });
    }
}

export default ProfileTab;
