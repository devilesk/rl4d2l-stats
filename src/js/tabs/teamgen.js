import Handsontable from 'handsontable';
import getTeamsData from '../../common/getTeamsData';
import BaseTab from './base';
import HandsontableConfig from '../handsontable.config';

class TeamgenTab extends BaseTab {
    constructor(App, tabId) {
        super(App, tabId);
        this.table = null;
    }

    getTitle() {
        return 'Team Generator';
    }

    getRoute() {
        const teamgenPlayers = this.getTeamgenPlayers();
        if (this.validateTeamgen(teamgenPlayers)) {
            return `${location.pathname}#/${this.tabId.replace('-tab', '')}/${teamgenPlayers.join(',')}`;
        }
        return `${location.pathname}#/${this.tabId.replace('-tab', '')}`;
    }

    onTabShow() {
        this.table.render();
    }

    async init() {
        this.table = new Handsontable(document.getElementById('teamgen-table'), Object.assign({}, HandsontableConfig, {
            data: [],
            columns: [
                { type: 'text' },
                { type: 'text' },
                { type: 'text' },
                { type: 'text' },
                { type: 'numeric' },
                { type: 'numeric' },
                { type: 'numeric' },
                { type: 'text' },
                { type: 'text' },
                { type: 'text' },
                { type: 'text' },
            ],
            colWidths(index) {
                return index >= 4 && index <= 6 ? 100 : 150;
            },
            fixedColumnsLeft: 0,
            nestedHeaders: [
                [{ label: 'Survivor', colspan: 4 }, 'Survivor Rating', 'Rating Diff', 'Infected Rating', { label: 'Infected', colspan: 4 }],
            ],
        }));

        // prefetch json
        this.App.getPlayers();
        this.App.getLeagueData(this.App.latestLeagueMatchId);

        const playersHash = location.hash.split('#/teamgen/')[1];
        if (playersHash) {
            const teamgenPlayers = decodeURIComponent(playersHash).split(',');
            await this.setTeamgenPlayers(teamgenPlayers);
        }
        else {
            const teamgenData = await this.App.getTeamgen();
            await this.setTeamgenPlayers(teamgenData.players);
        }
        this.updateTeamgen();

        // teamgen player dropdown handler
        $(document).on('change', 'select.teamgen', (e) => {
            this.updateTeamgen();
        });
        
        // stat season change handler
        this.App.on('seasonTypeChanged', (seasonType) => {
            this.updateTeamgen();
        });
    }

    getTeamgenPlayers() {
        const teamgenPlayers = [];
        for (let i = 0; i < 8; i++) {
            teamgenPlayers.push($(`#teamgen-p${i} :selected`).text());
        }
        return teamgenPlayers;
    }

    validateTeamgen(teamgenPlayers) {
        const counts = teamgenPlayers.reduce((acc, player) => {
            acc[player] = (acc[player] || 0) + 1;
            return acc;
        }, {});
        let isValid = true;
        for (let i = 0; i < 8; i++) {
            const player = $(`#teamgen-p${i} :selected`).text();
            if (counts[player] > 1) {
                document.getElementById(`teamgen-p${i}`).setCustomValidity(`${player} already selected.`);
                isValid = false;
            }
            else {
                document.getElementById(`teamgen-p${i}`).setCustomValidity('');
            }
        }
        return isValid;
    }

    async refresh() {
        if (!this.initialized) {
            this.initialized = this.init();
        }
        else {
            await this.initialized;
            const playersHash = location.hash.split('#/teamgen/')[1];
            if (playersHash) {
                const teamgenPlayers = decodeURIComponent(playersHash).split(',');
                await this.setTeamgenPlayers(teamgenPlayers);
            }
            else {
                const teamgenData = await this.App.getTeamgen();
                await this.setTeamgenPlayers(teamgenData.players);
            }
            const teamgenPlayers = this.getTeamgenPlayers();
            if (this.validateTeamgen(teamgenPlayers)) {
                document.getElementById('teamgen-form').classList.remove('was-validated');
                this.updateTeamsTable();
            }
            else {
                document.getElementById('teamgen-form').classList.add('was-validated');
            }
        }
    }

    updateTeamgen() {
        const teamgenPlayers = this.getTeamgenPlayers();
        document.getElementById('teamgen-result').innerHTML = `!teams ${teamgenPlayers.join(',')} ${this.App.seasonType === 'season' ? 'season' : 'all'}`;
        if (this.validateTeamgen(teamgenPlayers)) {
            document.getElementById('teamgen-form').classList.remove('was-validated');
            this.updateRoute();
            this.updateTeamsTable();
        }
        else {
            document.getElementById('teamgen-form').classList.add('was-validated');
        }
    }

    async updateTeamsTable() {
        const [leagueData, players] = await Promise.all([
            this.App.getLeagueData(this.App.latestLeagueMatchId),
            this.App.getPlayers(),
        ]);
        const steamIds = Array.from(new Set([
            document.getElementById('teamgen-p0').value,
            document.getElementById('teamgen-p1').value,
            document.getElementById('teamgen-p2').value,
            document.getElementById('teamgen-p3').value,
            document.getElementById('teamgen-p4').value,
            document.getElementById('teamgen-p5').value,
            document.getElementById('teamgen-p6').value,
            document.getElementById('teamgen-p7').value,
        ]));
        const playerNames = players.reduce((acc, row) => {
            acc[row.steamid] = row.name;
            return acc;
        }, {});
        this.table.loadData(getTeamsData(steamIds, playerNames, leagueData));
        this.table.getPlugin('columnSorting').sort({ column: 5, sortOrder: 'asc' });
    }

    async setTeamgenPlayers(teamgenPlayers) {
        const players = await this.App.getPlayers();
        for (let i = 0; i < 8; i++) {
            const name = teamgenPlayers[i];
            const player = players.find(p => p.name === name);
            if (player) {
                document.querySelector(`#teamgen-p${i} [value="${player.steamid}"]`).selected = true;
            }
        }
    }
}

export default TeamgenTab;
