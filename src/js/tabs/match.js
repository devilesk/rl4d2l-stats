import Handsontable from 'handsontable';
import Chart from 'chart.js';
import findColumnHeader from '../util/findColumnHeader';
import BaseTab from './base';
import HandsontableConfig from '../handsontable.config';

class MatchTab extends BaseTab {
    constructor(App, tabId) {
        super(App, tabId);
        this.tables = {};
        this.matchChart = null;
        this.matchPvPChart = null;
    }

    getTitle() {
        const sel = document.getElementById('matches-select');
        return `Match ${sel.options[sel.selectedIndex].text}`;
    }

    getRoute() {
        return `${location.pathname}#/${this.tabId.replace('-tab', '')}/${this.App.selectedMatchId}`;
    }

    onTabShow() {
        for (const side of this.App.sides) {
            this.tables[side].render();
        }
        this.matchChart.render();
        this.matchPvPChart.render();
    }

    async getMatchTableData(matchId, side) {
        const matchStatType = $('input:radio[name="match_stat_type"]:checked').val();
        const matchData = await this.App.getMatchData(matchId);
        return matchData[side][matchStatType].filter((row) => {
            const player = document.getElementById('match-player-filter').value;
            const round = document.getElementById('match-round-filter').value;
            return (player === '' || player === row.name) && (!matchStatType.startsWith('rnd') || round === '' || parseInt(round) === row.round);
        });
    }

    async init() {
        const self = this;
        const matchStatType = $('input:radio[name="match_stat_type"]:checked').val();
        for (const side of this.App.sides) {
            this.tables[side] = new Handsontable(document.getElementById(`match-table-${side}`), Object.assign({}, HandsontableConfig, {
                data: await this.getMatchTableData(this.App.selectedMatchId, side),
                colHeaders: this.App.getTableHeaders(side).filter(col => (matchStatType.startsWith('rnd') ? !col.startsWith('Rounds - ') : !col.startsWith('Round - '))),
                columns: this.App.getTableColumns(side).filter(col => (matchStatType.startsWith('rnd') ? col.data !== 'plyTotalRounds' && col.data !== 'infTotalRounds' : col.data !== 'round')),
                colWidths(index) {
                    return index === 0 ? 150 : 100;
                },
            }));
        }

        this.matchChart = new Chart(document.getElementById('match-chart'), {
            type: 'bar',
            data: await this.getMatchChartData(this.App.selectedMatchId),
            options: {
                plugins: { colorschemes: { scheme: 'brewer.Paired12' } },
                maintainAspectRatio: false,
                scales: {
                    xAxes: [{}],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            suggestedMax: 1,
                        },
                    }],
                },
            },
        });

        this.matchPvPChart = new Chart(document.getElementById('match-pvp-chart'), {
            type: 'bar',
            data: await this.getMatchPvPChartData(this.App.selectedMatchId),
            options: {
                plugins: { colorschemes: { scheme: 'brewer.Paired12' } },
                maintainAspectRatio: false,
                scales: {
                    xAxes: [{}],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            suggestedMax: 1,
                        },
                    }],
                },
            },
        });

        for (const side of this.App.sides) {
            document.getElementById(`match-${side}-stat`).addEventListener('change', (e) => {
                this.updateMatchChart();
            });
        }

        // stat columns toggle click handler
        this.App.on('columnChanged', (side) => {
            this.updateMatchTable(this.App.selectedMatchId, side);
        });

        // match stat type change handler
        this.App.on('matchStatTypeChanged', (matchStatType) => {
            this.updateMatchTable(this.App.selectedMatchId, this.App.selectedSide);
            this.updateMatchChart();
            if (matchStatType.startsWith('rnd')) {
                $('#match-round-filter').show();
            }
            else {
                $('#match-round-filter').hide();
            }
        });

        // side change handler
        this.App.on('sideChanged', (side) => {
            this.updateMatchTable(this.App.selectedMatchId, side);
            this.updateMatchChart();
        });

        document.getElementById('matches-select').addEventListener('change', (e) => {
            this.App.selectedMatchId = e.target.value;
            this.updateMatchPlayerFilter(this.App.selectedMatchId);
            this.updateMatchRoundFilter(this.App.selectedMatchId);
            this.updateMatchTable(this.App.selectedMatchId, this.App.selectedSide);
            this.updateMatchChart();
            this.updateMatchPvPChart();
        });

        // match pvp type change handler
        $(document).on('change', 'input:radio[name="match_pvp_type"]', (e) => {
            this.updateMatchPvPChart();
        });

        // match pvp aggregation type change handler
        $(document).on('change', 'input:radio[name="match_pvp_aggr_type"]', (e) => {
            this.updateMatchPvPChart();
        });

        this.updateMatchPlayerFilter(this.App.selectedMatchId);
        this.updateMatchRoundFilter(this.App.selectedMatchId);

        document.getElementById('match-player-filter').addEventListener('change', (e) => {
            this.updateMatchTable(this.App.selectedMatchId, this.App.selectedSide);
        });
        document.getElementById('match-round-filter').addEventListener('change', (e) => {
            this.updateMatchTable(this.App.selectedMatchId, this.App.selectedSide);
        });
    }

    async refresh() {
        if (!this.initialized) {
            this.initialized = this.init();
        }
        else {
            await this.initialized;
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
                data: [],
            };
            acc[row.steamid].data[row.round ? row.round - 1 : 0] = row[col];
            if (row.round > numRounds) numRounds = row.round;
            return acc;
        }, {});
        const steamIds = Object.keys(data);
        const datasets = [];
        for (let i = 0; i < steamIds.length; i++) {
            const steamId = steamIds[i];
            const values = data[steamId].data;
            for (let j = 0; j < values.length; j++) {
                if (datasets[j] == null) {
                    datasets[j] = {
                        label: matchStatType.startsWith('rnd') ? `Round ${j + 1}` : findColumnHeader(side, col).header,
                        data: [],
                    };
                }
                datasets[j].data[i] = values[j] || 0;
            }
        }
        return {
            datasets,
            labels: steamIds.map(steamId => data[steamId].label),
        };
    }

    async updateMatchPlayerFilter(matchId) {
        const matchData = await this.App.getMatchData(matchId);
        const players = Array.from(new Set(matchData.survivor.total.map(row => row.name).concat(matchData.infected.total.map(row => row.name))));
        const selectPlayers = document.getElementById('match-player-filter');
        selectPlayers.innerHTML = '';
        const opt = document.createElement('option');
        opt.value = '';
        opt.innerHTML = '------ all players ------';
        selectPlayers.appendChild(opt);
        for (const player of players) {
            const opt = document.createElement('option');
            opt.value = player;
            opt.innerHTML = player;
            selectPlayers.appendChild(opt);
        }
    }

    async updateMatchRoundFilter(matchId) {
        const matchData = await this.App.getMatchData(matchId);
        const rounds = Array.from(new Set(matchData.survivor.rndTotal.map(row => row.round).concat(matchData.infected.rndTotal.map(row => row.round))));
        const selectPlayers = document.getElementById('match-round-filter');
        selectPlayers.innerHTML = '';
        const opt = document.createElement('option');
        opt.value = '';
        opt.innerHTML = '------ all rounds ------';
        selectPlayers.appendChild(opt);
        for (const round of rounds) {
            const opt = document.createElement('option');
            opt.value = round;
            opt.innerHTML = round;
            selectPlayers.appendChild(opt);
        }
    }

    async updateMatchTable(matchId, side) {
        this.App.selectedColumns[side] = Array.from(document.querySelectorAll(`input[name=${side}-columns]:checked`)).map(el => el.value);
        const matchData = await this.getMatchTableData(matchId, side);
        this.tables[side].loadData(matchData);
        const matchStatType = $('input:radio[name="match_stat_type"]:checked').val();
        this.tables[side].updateSettings({
            colHeaders: this.App.getTableHeaders(side).filter(col => (matchStatType.startsWith('rnd') ? !col.startsWith('Rounds - ') : !col.startsWith('Round - '))),
            columns: this.App.getTableColumns(side).filter(col => (matchStatType.startsWith('rnd') ? col.data !== 'plyTotalRounds' && col.data !== 'infTotalRounds' : col.data !== 'round')),
        });
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
            acc[row.aId + row.vId] = acc[row.aId + row.vId] || {
                label: `${row.attacker} -> ${row.victim}`,
                data: [],
            };
            if (matchPvPAggregationType === 'round') {
                acc[row.aId + row.vId].data[row.round ? row.round - 1 : 0] = row.damage;
            }
            else {
                acc[row.aId + row.vId].data[0] = (acc[row.aId + row.vId].data[0] || 0) + row.damage;
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
                if (datasets[j] == null) {
                    datasets[j] = {
                        label: matchPvPAggregationType === 'round' ? `Round ${j + 1}` : 'Match Total',
                        data: [],
                    };
                }
                datasets[j].data[i] = values[j] || 0;
            }
        }
        return {
            datasets,
            labels: steamIds.map(steamId => data[steamId].label),
        };
    }

    async updateMatchPvPChart() {
        this.matchPvPChart.data = await this.getMatchPvPChartData(this.App.selectedMatchId);
        this.matchPvPChart.update();
    }
}

export default MatchTab;
