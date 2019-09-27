import Handsontable from 'handsontable';
import processRankings from '../common/processRankings';
import columns from '../data/columns';
import HandsontableConfig from './handsontable.config';
import getJSON from './util/getJSON';

class App {
    constructor() {
        this.tables = {};
    }

    render() {
        this.tables.total.render();
        this.tables.survivor.render();
        this.tables.infected.render();
    }

    async init() {
        const tableOptions = Object.assign({}, HandsontableConfig, {
            data: [],
            colWidths: [100, 50, 50],
            fixedColumnsLeft: 0,
        });

        this.tables.total = new Handsontable(document.getElementById('table-rankings-total'), Object.assign({}, tableOptions, {
            columns: [
                {
                    data: 'name',
                    type: 'text',
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

        await this.updateTable();

        const self = this;
        $('.weight-input').on('input', async function (event) {
            const stat = $(this).attr('id').replace('-input', '');
            const weight = parseFloat($(this).val());
            const side = stat.startsWith('ply') ? 'survivor' : 'infected';
            columns[side].find(col => col.data === stat).weight = isNaN(weight) ? null : weight;
            await self.updateTable();
            self.render();
            $('#output').val(JSON.stringify(columns, null, 2));
        });
    }

    async getLeagueData() {
        if (!this.leagueData) {
            this.leagueData = getJSON('data/league.json');
        }
        return this.leagueData;
    }

    async updateTable() {
        const leagueData = await this.getLeagueData();
        leagueData.rankings = processRankings(leagueData, columns);
        for (const table of Object.values(this.tables)) {
            table.loadData(leagueData.rankings);
            table.updateSettings({ height: 52 + 24 * leagueData.rankings.length });
            table.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
        }
    }
}

const app = new App();
app.init();
