import Handsontable from 'handsontable';
import boldCellRenderer from '../util/boldCellRenderer';
import matchIdRenderer from '../util/matchIdRenderer';
import BaseTab from './base';
import HandsontableConfig from '../handsontable.config';

class MatchesTab extends BaseTab {
    constructor(App, tabId) {
        super(App, tabId);
        this.table = null;
    }

    onTabShow() {
        this.table.render();
    }

    async init() {
        const matches = await this.App.getMatches();
        this.table = new Handsontable(document.getElementById('matches-table'), Object.assign({}, HandsontableConfig, {
            data: matches.data,
            cells(row, col) {
                const cellProperties = {};
                if ((matches.data[row][3] === '>' && col === 2) || (matches.data[row][3] === '<' && col === 4)) {
                    cellProperties.renderer = boldCellRenderer;
                }

                return cellProperties;
            },
            colHeaders: matches.headers,
            columns: [
                { type: 'text', renderer: matchIdRenderer },
                { type: 'text' },
                { type: 'text' },
                { type: 'text', className: 'text-center' },
                { type: 'text' },
                {
                  type: 'date',
                  dateFormat: 'MM/DD/YYYY HH:mm',
                },
            ],
            colWidths: [150, 150, 450, 50, 450, 150],
            fixedColumnsLeft: 0,
        }));
        this.table.getPlugin('columnSorting').sort({ column: 5, sortOrder: 'desc' });

        $('#filter').click(() => {
            this.updateMatchesTable();
        });

        $('#filter-clear').click(() => {
            $('#filter-maps').val('');
            for (let i = 0; i < 8; i++) {
                $(`#filter-p${i}`).val('');
            }
            this.updateMatchesTable();
        });
    }

    async updateMatchesTable() {
        const matches = await this.App.getMatches();
        const teams = [[], []];
        const results = [0, 0];
        for (let i = 0; i < 8; i++) {
            const player = $(`#filter-p${i}`).val();
            if (player) teams[i < 4 ? 0 : 1].push(player);
        }
        const filteredMatches = matches.data.filter((row) => {
            const map = $('#filter-maps').val();
            if (map && map !== row[1]) return false;
            if (teams[0].every(p => row[2].indexOf(p) !== -1) && teams[1].every(p => row[4].indexOf(p) !== -1)) {
                if (row[3] == '>') results[0]++;
                if (row[3] == '<') results[1]++;
                return true;
            }
            if (teams[1].every(p => row[2].indexOf(p) !== -1) && teams[0].every(p => row[4].indexOf(p) !== -1)) {
                if (row[3] == '>') results[1]++;
                if (row[3] == '<') results[0]++;
                return true;
            }
            return false;
        });
        if (teams[0].length || teams[1].length) {
            $('#filter-result').text(`${teams[0].length ? teams[0].join(',') : 'anyone'} vs ${teams[1].length ? teams[1].join(',') : 'anyone'}: ${results[0]} - ${results[1]}`);
            $('#filter-result').show();
        }
        else {
            $('#filter-result').hide();
            $('#filter-result').text('');
        }
        this.table.loadData(filteredMatches);
        this.table.getPlugin('columnSorting').sort({ column: 5, sortOrder: 'desc' });
    }
}

export default MatchesTab;
