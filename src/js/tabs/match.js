import Handsontable from 'handsontable';
import Chart from 'chart.js';
import findColumnHeader from '../util/findColumnHeader';
import BaseTab from './base';

class MatchTab extends BaseTab {
    constructor(App, tabId) {
        super(App, tabId);
        this.tables = {};
        this.matchChart = {};
    }
    
    getTitle() {
        const sel = document.getElementById('matches-select');
        return `Match ${sel.options[sel.selectedIndex].text}`;
    }
    
    getRoute() {
        return `${location.pathname}#/${this.tabId.replace('-tab', '')}/${this.App.selectedMatchId}`;
    }
    
    async init() {
        super.init();
        const self = this;
        
        this.matchChart = new Chart(document.getElementById('match-chart'), {
            type: 'bar',
            data: await this.getMatchChartData(this.App.selectedMatchId),
            options: {
                plugins: {
                    colorschemes: {
                        scheme: 'brewer.Paired12'
                    }
                },
                maintainAspectRatio: false,
                scales: {
                    xAxes: [{
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            suggestedMax: 1
                        }
                    }]
                }
            }
        });
        
        this.matchPvPChart = new Chart(document.getElementById('match-pvp-chart'), {
            type: 'bar',
            data: await this.getMatchPvPChartData(this.App.selectedMatchId),
            options: {
                plugins: {
                    colorschemes: {
                        scheme: 'brewer.Paired12'
                    }
                },
                maintainAspectRatio: false,
                scales: {
                    xAxes: [{
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            suggestedMax: 1
                        }
                    }]
                }
            }
        });
        
        for (const side of this.App.sides) {
            document.getElementById(`match-${side}-stat`).addEventListener('change', e => {
                this.updateMatchChart();
            });
        }
        
        // match stat type change handler
        $(document).on('change', 'input:radio[name="match_stat_type"]', e => {
            this.updateMatchChart();
        });
        
        // side change handler
        this.App.on('sideChanged', () => {
            this.updateMatchChart();
        });

        document.getElementById('matches-select').addEventListener('change', e => {
            this.App.selectedMatchId = e.target.value;
            this.updateMatchChart();
            this.updateMatchPvPChart();
        });
        
        // match pvp type change handler
        $(document).on('change', 'input:radio[name="match_pvp_type"]', e => {
            this.updateMatchPvPChart();
        });

        // match pvp aggregation type change handler
        $(document).on('change', 'input:radio[name="match_pvp_aggr_type"]', e => {
            this.updateMatchPvPChart();
        });
    }
    
    async refresh() {
        if (!this.initialized) {
            this.init();
        }
        else {
            this.updateMatchChart();
            this.updateMatchPvPChart();
        }
    }
    
    async getMatchChartData(matchId) {
        const side = $('input:radio[name="side"]:checked').val();
        const matchStatType = $('input:radio[name="match_stat_type"]:checked').val();
        const col = document.getElementById(`match-${side}-stat`).value;
        let numRounds = 0;
        const matchData = await this.App.getMatchData(matchId);
        const data = matchData[side][matchStatType].reduce((acc, row) => {
            acc[row.steamid] = acc[row.steamid] || {
                label: row.name,
                data: []
            };
            acc[row.steamid].data[row.round || 0] = row[col];
            if (row.round > numRounds) numRounds = row.round;
            return acc;
        }, {});
        const steamIds = Object.keys(data);
        const datasets = [];
        for (let i = 0; i < steamIds.length; i++) {
            const steamId = steamIds[i];
            const values = data[steamId].data;
            for (let j = 0; j < values.length; j++) {
                if (datasets[j] == null) datasets[j] = {
                    label: matchStatType.startsWith('rnd') ? 'Round ' + (j + 1) : findColumnHeader(side, col).header,
                    data: []
                };
                datasets[j].data[i] = values[j] || 0;
            }
        }
        return {
            datasets: datasets,
            labels: steamIds.map(steamId => data[steamId].label)
        }
    }
    
    async updateMatchChart() {
        this.matchChart.data = await this.getMatchChartData(this.App.selectedMatchId);
        this.matchChart.update();
    }
    
    async getMatchPvPChartData(matchId) {
        const matchPvPType = $('input:radio[name="match_pvp_type"]:checked').val();
        const matchPvPAggregationType = $('input:radio[name="match_pvp_aggr_type"]:checked').val();
        let numRounds = 0;
        const matchData = await this.App.getMatchData(matchId);
        const data = matchData[matchPvPType].reduce((acc, row) => {
            acc[row.aId+row.vId] = acc[row.aId+row.vId] || {
                label: `${row.attacker} -> ${row.victim}`,
                data: []
            };
            if (matchPvPAggregationType === 'round') {
                acc[row.aId+row.vId].data[row.round || 0] = row.damage;
            }
            else {
                acc[row.aId+row.vId].data[0] = (acc[row.aId+row.vId].data[0] || 0) + row.damage;
            }
            if (row.round > numRounds) numRounds = row.round;
            return acc;
        }, {});
        const steamIds = Object.keys(data);
        const datasets = [];
        for (let i = 0; i < steamIds.length; i++) {
            const steamId = steamIds[i];
            const values = data[steamId].data;
            for (let j = 0; j < values.length; j++) {
                if (datasets[j] == null) datasets[j] = {
                    label: matchPvPAggregationType === 'round' ? 'Round ' + (j + 1) : 'Match Total',
                    data: []
                };
                datasets[j].data[i] = values[j] || 0;
            }
        }
        return {
            datasets: datasets,
            labels: steamIds.map(steamId => data[steamId].label)
        }
    }
    
    async updateMatchPvPChart() {
        this.matchPvPChart.data = await this.getMatchPvPChartData(this.App.selectedMatchId);
        this.matchPvPChart.update();
    }
}

export default MatchTab;