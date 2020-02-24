import Handsontable from 'handsontable';
import boldCellRenderer from '../util/boldCellRenderer';
import matchIdRenderer from '../util/matchIdRenderer';
import BaseTab from './base';
import HandsontableConfig from '../handsontable.config';
import QueryBuilder from '../queryBuilder';

const colMap = {
    teamA: 2,
    teamB: 6,
    result: 4,
    teamATotal: 3,
    teamBTotal: 5,
    pointDiff: 7,
    matchId: 0,
    map: 1,
    season: 8,
}

const labelMap = {
    teamA: 'Team A',
    teamB: 'Team B',
    result: 'Result',
    teamATotal: 'Points A',
    teamBTotal: 'Points B',
    pointDiff: 'Pt. Diff.',
    matchId: 'Match ID',
    map: 'Map',
    season: 'Season',
}

const getRowValue = (row, id) => row[colMap[id]];

const opFns = {
    contains: (rowVal, ruleVal) => rowVal.indexOf(ruleVal) !== -1,
    not_contains: (rowVal, ruleVal) => rowVal.indexOf(ruleVal) === -1,
    equal: (rowVal, ruleVal) => rowVal === ruleVal,
    not_equal: (rowVal, ruleVal) => rowVal !== ruleVal,
    less: (rowVal, ruleVal) => rowVal < ruleVal,
    less_or_equal: (rowVal, ruleVal) => rowVal <= ruleVal,
    greater: (rowVal, ruleVal) => rowVal > ruleVal,
    greater_or_equal: (rowVal, ruleVal) => rowVal >= ruleVal,
    between: (rowVal, [ruleMinVal, ruleMaxVal]) => rowVal >= ruleMinVal && rowVal <= ruleMaxVal,
    not_between: (rowVal, [ruleMinVal, ruleMaxVal]) => rowVal < ruleMinVal || rowVal > ruleMaxVal,
};

const opStringFns = {
    contains: (rowVal, ruleVal) => `${rowVal} contains ${ruleVal}`,
    not_contains: (rowVal, ruleVal) => `${rowVal} not contains ${ruleVal}`,
    equal: (rowVal, ruleVal) => `${rowVal} equals ${ruleVal}`,
    not_equal: (rowVal, ruleVal) => `${rowVal} not equals ${ruleVal}`,
    less: (rowVal, ruleVal) => `${rowVal} < ${ruleVal}`,
    less_or_equal: (rowVal, ruleVal) => `${rowVal} <=  ${ruleVal}`,
    greater: (rowVal, ruleVal) => `${rowVal} > ${ruleVal}`,
    greater_or_equal: (rowVal, ruleVal) => `${rowVal} >= ${ruleVal}`,
    between: (rowVal, [ruleMinVal, ruleMaxVal]) => `${rowVal} between ${ruleMinVal} and ${ruleMaxVal}`,
    not_between: (rowVal, [ruleMinVal, ruleMaxVal]) => `${rowVal} not between ${ruleMinVal} and ${ruleMaxVal}`,
};

const ruleEvaluator = (rule, row) => {
    if (rule.condition === 'AND') return rule.rules.every(rule => ruleEvaluator(rule, row));
    if (rule.condition === 'OR') return rule.rules.some(rule => ruleEvaluator(rule, row));
    return opFns[rule.operator](getRowValue(row, rule.id), rule.value);
};

const ruleStringEvaluator = rule => {
    if (rule.condition) return '(' + rule.rules.map(rule => ruleStringEvaluator(rule)).join(` ${rule.condition} `) + ')';
    if (rule.id === 'result') return `Team ${rule.value === '>' ? 'A' : 'B'} wins`;
    return opStringFns[rule.operator](labelMap[rule.id], rule.value);
};

class MatchesTab extends BaseTab {
    constructor(App, tabId) {
        super(App, tabId);
        this.table = null;
    }

    onTabShow() {
        this.table.render();
        document.title = this.getFullTitle();
    }

    getTitle() {
        return 'Matches';
    }

    async init() {
        document.title = this.getFullTitle();
        const matches = await this.App.getMatches();
        this.table = new Handsontable(document.getElementById('matches-table'), Object.assign({}, HandsontableConfig, {
            data: matches.data,
            cells: function (row, col) {
                const cellProperties = {};
                const data = this.instance.getSourceData();

                if (!data[row]) return cellProperties;

                if ((data[row][4] === '>' && col === 2) || (data[row][4] === '<' && col === 6)) {
                    cellProperties.renderer = boldCellRenderer;
                }
                else if (col === 2 || col === 6) {
                    cellProperties.renderer = 'text';
                }

                return cellProperties;
            },
            colHeaders: matches.headers,
            columns: [
                { type: 'text', renderer: matchIdRenderer },
                { type: 'text' },
                { type: 'text' },
                { type: 'numeric' },
                { type: 'text', className: 'text-center' },
                { type: 'numeric' },
                { type: 'text' },
                { type: 'numeric' },
                { type: 'numeric' }
            ],
            colWidths: [110, 150, 420, 50, 50, 50, 420, 50, 150],
            fixedColumnsLeft: 0,
            columnSorting: {
              sortEmptyCells: true,
              initialConfig: {
                column: 0,
                sortOrder: 'desc'
              }
            }
        }));

        $('#filter').click(() => {
            this.updateMatchesTable();
        });

        $('#filter-advanced').click(() => {
            if ($('#filter-advanced').hasClass("active")) {
                $('#filter-advanced').removeClass("active");
                $('.filter-basic').show();
                $('.filter-advanced').hide();
            }
            else {
                $('#filter-advanced').addClass("active");
                $('.filter-basic').hide();
                $('.filter-advanced').show();
            }
        });

        $('#filter-clear').click(() => {
            if ($('#filter-advanced').hasClass("active")) {
                $('#builder').queryBuilder('reset');
                $('#builder').one('validationError.queryBuilder', function(e, rule, error, value) {
                    e.preventDefault();
                });
            }
            else {
                $('#filter-maps').val('');
                for (let i = 0; i < 8; i++) {
                    $(`#filter-p${i}`).val('');
                }
            }
            this.updateMatchesTable();
        });

        const players = await this.App.getPlayers();
        const playerNames = players.map(player => player.name);
        const mapNames = Array.from(matches.data.reduce((acc, row) => {
            acc.add(row[1]);
            return acc;
        }, new Set()));

        $('#builder').queryBuilder({
            filters: [
                {
                    id: 'teamA',
                    label: 'Team A',
                    type: 'string',
                    input: 'select',
                    values: playerNames,
                    operators: ['contains', 'not_contains'],
                },
                {
                    id: 'teamB',
                    label: 'Team B',
                    type: 'string',
                    input: 'select',
                    values: playerNames,
                    operators: ['contains','not_contains'],
                },
                {
                    id: 'result',
                    label: 'Result',
                    type: 'string',
                    input: 'select',
                    values: ['>','<'],
                    operators: ['equal','not_equal'],
                },
                {
                    id: 'teamATotal',
                    label: 'Points A',
                    type: 'integer',
                    operators: ['equal','not_equal','less','less_or_equal','greater','greater_or_equal','between','not_between'],
                },
                {
                    id: 'teamBTotal',
                    label: 'Points B',
                    type: 'integer',
                    operators: ['equal','not_equal','less','less_or_equal','greater','greater_or_equal','between','not_between'],
                },
                {
                    id: 'pointDiff',
                    label: 'Pt. Diff.',
                    type: 'integer',
                    operators: ['equal','not_equal','less','less_or_equal','greater','greater_or_equal','between','not_between'],
                },
                {
                    id: 'matchId',
                    label: 'Match ID',
                    type: 'integer',
                    operators: ['equal','not_equal','less','less_or_equal','greater','greater_or_equal','between','not_between'],
                },
                {
                    id: 'map',
                    label: 'Map',
                    type: 'string',
                    input: 'select',
                    values: mapNames,
                    operators: ['equal','not_equal'],
                },
                {
                    id: 'season',
                    label: 'Season',
                    type: 'integer',
                    operators: ['equal','not_equal','less','less_or_equal','greater','greater_or_equal','between','not_between'],
                },
            ]
        });
    }

    async updateMatchesTable() {
        const isAdvancedFilter = $('#filter-advanced').hasClass("active");
        const matches = await this.App.getMatches();
        let filteredMatches;
        if (!isAdvancedFilter) {
            const teams = [[], []];
            const results = [0, 0];
            for (let i = 0; i < 8; i++) {
                const player = $(`#filter-p${i}`).val();
                if (player) teams[i < 4 ? 0 : 1].push(player);
            }
            filteredMatches = matches.data.filter((row) => {
                const map = $('#filter-maps').val();
                if (map && map !== row[1]) return false;
                if (teams[0].every(p => row[2].indexOf(p) !== -1) && teams[1].every(p => row[6].indexOf(p) !== -1)) {
                    if (row[4] == '>') results[0]++;
                    if (row[4] == '<') results[1]++;
                    return true;
                }
                if (teams[1].every(p => row[2].indexOf(p) !== -1) && teams[0].every(p => row[6].indexOf(p) !== -1)) {
                    if (row[4] == '>') results[1]++;
                    if (row[4] == '<') results[0]++;
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
        }
        else {
            const rule = $('#builder').queryBuilder('getRules');
            if (rule) {
                filteredMatches = matches.data.filter(row => ruleEvaluator(rule, row));
                const ruleString = ruleStringEvaluator(rule);
                $('#filter-result').text(ruleString.substring(1, ruleString.length - 1));
                $('#filter-result').show();
            }
            else {
                filteredMatches = matches.data;
                $('#filter-result').hide();
                $('#filter-result').text('');
            }
        }
        this.table.loadData(filteredMatches);
    }
}

export default MatchesTab;
