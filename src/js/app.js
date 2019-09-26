import formatDate from '../common/formatDate';
import getJSON from './util/getJSON';
import Promise from 'bluebird';
import LeagueTab from './tabs/league';
import StatsTab from './tabs/stats';
import RankingsTab from './tabs/rankings';
import ProfileTab from './tabs/profile';
import MatchesTab from './tabs/matches';
import MatchTab from './tabs/match';
import TeamgenTab from './tabs/teamgen';
import RecordsTab from './tabs/records';
import MatchupsTab from './tabs/matchups';
import HomeTab from './tabs/home';
import EventEmitter from 'eventemitter3';
import columns from '../data/columns';
import playerLinkRenderer from './util/playerLinkRenderer';
import './chartjs-plugin-colorschemes';

class App extends EventEmitter {
    constructor() {
        super();

        const self = this;
        this.profileTrendData = {};
        this.leagueData = {};
        this.seasonData = {};
        this.matchData = {};
        this.playerData = {};
        this.sides = ['survivor', 'infected'];

        const seasonType = localStorage.getItem('seasonType');
        if (seasonType) {
            $('input:radio[name="season_type"]').parent().removeClass('active');
            $(`input:radio[name="season_type"][value="${seasonType}"]`).prop('checked', true);
            $(`input:radio[name="season_type"][value="${seasonType}"]`).parent().addClass('active');
        }
        const statType = localStorage.getItem('statType');
        if (statType) {
            $('input:radio[name="stat_type"]').parent().removeClass('active');
            $(`input:radio[name="stat_type"][value="${statType}"]`).prop('checked', true);
            $(`input:radio[name="stat_type"][value="${statType}"]`).parent().addClass('active');
        }
        const matchStatType = localStorage.getItem('matchStatType');
        if (matchStatType) {
            $('input:radio[name="match_stat_type"]').parent().removeClass('active');
            $(`input:radio[name="match_stat_type"][value="${matchStatType}"]`).prop('checked', true);
            $(`input:radio[name="match_stat_type"][value="${matchStatType}"]`).parent().addClass('active');
        }

        this.seasonType = $('input:radio[name="season_type"]:checked').val();
        this.statType = $('input:radio[name="stat_type"]:checked').val();
        this.wlStatType = $('input:radio[name="wl_stat_type"]:checked').val();
        this.matchupType = $('input:radio[name="matchup_type"]:checked').val();
        this.wlType = $('input:radio[name="wl_type"]:checked').val();
        this.dmgType = $('input:radio[name="dmg_type"]:checked').val();
        this.dmgAggregationType = $('input:radio[name="dmg_aggr_type"]:checked').val();
        this.selectedColumns = {
            survivor: Array.from(document.querySelectorAll('input[name=survivor-columns]:checked')).map(el => el.value),
            infected: Array.from(document.querySelectorAll('input[name=infected-columns]:checked')).map(el => el.value),
        };
        this.selectedSide = $('input:radio[name="side"]:checked').val();
        this.selectedSeason = document.getElementById('season-select').value;
        this.selectedLeagueMatchId = document.getElementById('league-matches-select').value;
        this.latestLeagueMatchId = document.getElementById('league-matches-select').value;
        this.categories = new Map(Array.from(document.querySelectorAll('.survivor-columns-category, .infected-columns-category')).map(el => [el.id.replace('survivor-columns-category-', '').replace('infected-columns-category-', ''), el.innerHTML]));

        this.init().then(() => {
            if (location.hash.startsWith('#/profile/')) {
                this.getPlayers().then((players) => {
                    const name = players.find(player => player.steamid === this.selectedSteamId).name;
                    history.replaceState(null, null, `${location.pathname}#/profile/${name}`);
                });
            }
            else if (location.hash.startsWith('#/match/')) {
                history.replaceState(null, null, `${location.pathname}#/match/${this.selectedMatchId}`);
            }
            else if (location.hash.startsWith('#/league/')) {
                history.replaceState(null, null, `${location.pathname}#/league/${this.selectedSeason}`);
            }
        });

        document.getElementById('players-select').addEventListener('change', (e) => {
            this.getPlayers().then((players) => {
                this.selectedSteamId = players.find(player => player.name === e.target.value).steamid;
                this.profileTab.updateRoute();
            });
        });

        document.getElementById('season-select').addEventListener('change', (e) => {
            this.selectedSeason = e.target.value;
            this.leagueTab.updateRoute();
            this.emit('seasonChanged', self.selectedSeason);
        });

        document.getElementById('matches-select').addEventListener('change', (e) => {
            this.selectedMatchId = e.target.value;
            this.matchTab.updateRoute();
        });

        this.homeTab = new HomeTab(this, 'home-tab');
        this.rankingsTab = new RankingsTab(this, 'rankings-tab');
        this.leagueTab = new LeagueTab(this, 'league-tab');
        this.statsTab = new StatsTab(this, 'stats-tab');
        this.matchupsTab = new MatchupsTab(this, 'matchups-tab');
        this.matchesTab = new MatchesTab(this, 'matches-tab');
        this.matchTab = new MatchTab(this, 'match-tab');
        this.recordsTab = new RecordsTab(this, 'records-tab');
        this.profileTab = new ProfileTab(this, 'profile-tab');
        this.teamgenTab = new TeamgenTab(this, 'teamgen-tab');

        // show initial tab
        if (location.hash) {
            const tabId = location.hash.split('#')[1].split('/')[1];
            if (tabId) {
                $(`#${tabId}-tab`).tab('show');
            }
        }

        // side change handler
        $(document).on('change', 'input:radio[name="side"]', function (event) {
            self.selectedSide = $(this).val();
            self.updateSideVisibility();
            self.emit('sideChanged', self.selectedSide);
        });

        // season type change handler
        $(document).on('change', 'input:radio[name="season_type"]', function (event) {
            self.seasonType = $(this).val();
            localStorage.setItem('seasonType', self.seasonType);
            self.emit('seasonTypeChanged', self.seasonType);
        });

        // stat type change handler
        $(document).on('change', 'input:radio[name="stat_type"]', function (event) {
            self.statType = $(this).val();
            localStorage.setItem('statType', self.statType);
            self.emit('statTypeChanged', self.statType);
        });

        // match stat type change handler
        $(document).on('change', 'input:radio[name="match_stat_type"]', function (event) {
            self.matchStatType = $(this).val();
            localStorage.setItem('matchStatType', self.matchStatType);
            self.emit('matchStatTypeChanged', self.matchStatType);
        });

        for (const side of this.sides) {
            // stat columns toggle click handler
            $(document).on('change', `input:checkbox[name="${side}-columns"]`, (e) => {
                self.emit('columnChanged', side);
            });

            // stat column categories toggle click handler
            $(`.${side}-columns-category`).click((e) => {
                const category = e.target.id.replace(`${side}-columns-category-`, '');
                $(`input:checkbox[name="${side}-columns"]`).each(function () {
                    const col = $(this).attr('id').replace('-checkbox', '');
                    const column = columns[side].find(column => column.data === col);
                    if (column && column.categories) {
                        if (column.categories.indexOf(category) !== -1) {
                            $(this).prop('checked', true);
                            $(this).parent().addClass('active');
                        }
                    }
                });
                self.emit('columnChanged', side);
            });

            // stat columns reset click handler
            $(`#${side}-columns-reset`).click((e) => {
                $(`input:checkbox[name="${side}-columns"]`).prop('checked', true);
                $(`input:checkbox[name="${side}-columns"]`).parent().addClass('active');
                self.emit('columnChanged', side);
            });

            // stat columns clear click handler
            $(`#${side}-columns-clear`).click((e) => {
                $(`input:checkbox[name="${side}-columns"]:not([id="name-${side}-checkbox"])`).prop('checked', false);
                $(`input:checkbox[name="${side}-columns"]:not([id="name-${side}-checkbox"])`).parent().removeClass('active');
                self.emit('columnChanged', side);
            });

            // stat columns search input handler
            $(`#${side}-columns-search`).on('input', (e) => {
                $(`input:checkbox[name="${side}-columns"]`).parent().removeClass('text-warning');
                for (const column of columns[side]) {
                    if (e.target.value
                        && (column.header.toLowerCase().indexOf(e.target.value.toLowerCase()) !== -1
                         || column.notes.toLowerCase().indexOf(e.target.value.toLowerCase()) !== -1
                         || (column.categories && column.categories.map(categoryId => this.categories.get(categoryId).toLowerCase()).some(category => category.indexOf(e.target.value.toLowerCase()) !== -1))
                        )
                    ) {
                        $(`input:checkbox[name="${side}-columns"][value="${column.data}"]`).parent().addClass('text-warning');
                    }
                }
            });
        }

        // tab change handler
        $('a[data-toggle="tab"]').on('shown.bs.tab', (e) => {
            this.showTab(e.target.id);
        });

        window.addEventListener('popstate', (event) => {
            const tabName = location.hash ? location.hash.split('#')[1].split('/')[1] : 'home';
            if (tabName) {
                this.init();
                $('.nav-link').blur();
                $(`#${tabName}-tab`).tab('show');
                this.emit(`${tabName}-tab.refresh`);
            }
        });
    }

    async init() {
        const matchId = parseInt(location.hash.split('#/match/')[1]);
        if (!isNaN(matchId) && document.querySelector(`#matches-select [value="${matchId}"]`)) {
            document.getElementById('matches-select').value = matchId;
            document.getElementById('matches-select').dispatchEvent(new Event('change'));
        }
        this.selectedMatchId = document.getElementById('matches-select').value;
        
        const season = parseInt(location.hash.split('#/league/')[1]);
        if (!isNaN(season) && document.querySelector(`#season-select [value="${season}"]`)) {
            document.getElementById('season-select').value = season;
            document.getElementById('season-select').dispatchEvent(new Event('change'));
        }
        this.selectedSeason = document.getElementById('season-select').value;

        return this.getPlayers().then((players) => {
            let name = location.hash.split('#/profile/')[1];
            if (name) {
                name = decodeURIComponent(name);
            }
            else {
                name = localStorage.getItem('name') || '';
            }
            const player = players.find(player => player.name.toLowerCase() === name.toLowerCase());
            if (!player) {
                localStorage.removeItem('name');
            }
            else {
                localStorage.setItem('name', player.name);
                document.getElementById('players-select').value = player.name;
            }
            const steamId = players.find(player => player.name === document.getElementById('players-select').value).steamid;
            this.selectedSteamId = steamId;
        });
    }

    showTab(tabId) {
        for (const side of this.sides) {
            $(`.${side}-columns-container`).hide();
            if (tabId === `${side}-tab`) {
                $(`.${side}-columns-container`).show();
            }
        }
        $('.nav-item').removeClass('active');
        $(`#${tabId}`).parent().addClass('active');
        $('.tab-option').hide();
        $(`.${tabId}-option`).show();
        this.updateSideVisibility();
    }

    updateSideVisibility() {
        if (this.selectedSide === 'survivor') {
            $('.survivor').show();
            $('.infected').hide();
        }
        else {
            $('.infected').show();
            $('.survivor').hide();
        }
    }

    async getMatches() {
        if (!this.matches) {
            this.matches = getJSON(`data/matches.json?t=${timestamps.matches}`);
        }
        return this.matches.then((matches) => {
            for (const row of matches.data) {
                row.push(formatDate(new Date(row[0] * 1000)));
            }
            matches.headers.push('Date');
            return matches;
        });
    }

    async getDamageMatrix() {
        if (this.seasonType === 'season') {
            if (!this.damageMatrixSeason) {
                this.damageMatrixSeason = getJSON(`data/damageMatrixSeason.json?t=${timestamps.damageMatrix}`);
            }
            return this.damageMatrix;
        }

        if (!this.damageMatrix) {
            this.damageMatrix = getJSON(`data/damageMatrix.json?t=${timestamps.damageMatrix}`);
        }
        return this.damageMatrix;
    }

    async getWlMatrix() {
        if (this.seasonType === 'season') {
            if (!this.wlMatrixSeason) {
                this.wlMatrixSeason = getJSON(`data/wlMatrixSeason.json?t=${timestamps.wlMatrix}`);
            }
            return this.wlMatrixSeason;
        }

        if (!this.wlMatrix) {
            this.wlMatrix = getJSON(`data/wlMatrix.json?t=${timestamps.wlMatrix}`);
        }
        return this.wlMatrix;
    }

    async getPlayerMapWL() {
        if (this.seasonType === 'season') {
            if (!this.playerMapWLSeason) {
                this.playerMapWLSeason = getJSON(`data/playerMapWLSeason.json?t=${timestamps.playerMapWL}`);
            }
            return this.playerMapWLSeason;
        }

        if (!this.playerMapWL) {
            this.playerMapWL = getJSON(`data/playerMapWL.json?t=${timestamps.playerMapWL}`);
        }
        return this.playerMapWL;
    }

    async getPlayers() {
        if (!this.players) {
            this.players = getJSON(`data/players.json?t=${timestamps.players}`);
        }
        return this.players;
    }

    async getTeamgen() {
        return getJSON(`data/teamgen.json?t=${Date.now()}`).catch(e => ({ players: [] }));
    }

    async getPlayerData(steamId) {
        if (!this.playerData[steamId]) {
            this.playerData[steamId] = getJSON(`data/players/${steamId}.json?t=${timestamps.matches}`);
        }
        return this.playerData[steamId].catch((e) => {
            delete this.playerData[steamId];
            return null;
        });
    }

    async getMatchData(matchId) {
        if (!this.matchData[matchId]) {
            this.matchData[matchId] = getJSON(`data/matches/${matchId}.json?t=${timestamps.matches}`);
        }
        return this.matchData[matchId];
    }

    async getSelectedMatchData(matchId) {
        return getMatchData(this.selectedMatchId);
    }

    async getLeagueData(matchId) {
        if (this.seasonType === 'season') {
            if (!this.seasonData[matchId]) {
                this.seasonData[matchId] = getJSON(`data/season/${matchId}.json?t=${timestamps.matches}`);
            }
            return this.seasonData[matchId];
        }

        if (!this.leagueData[matchId]) {
            this.leagueData[matchId] = getJSON(`data/league/${matchId}.json?t=${timestamps.matches}`);
        }
        return this.leagueData[matchId];
    }

    async getSelectedLeagueData() {
        return getLeagueData(this.selectedLeagueMatchId);
    }

    async getStatsForPlayer(steamId, side, statType) {
        const leagueData = await this.getLeagueData(this.latestLeagueMatchId);
        return leagueData[side][statType].find(row => row.steamid == steamId) || {};
    }

    toTableColumnFormat(col) {
        const column = { data: col.data };
        if (column.data === 'name') {
            column.type = 'text';
            column.renderer = playerLinkRenderer;
        }
        else if (column.data === 'steamid') {
            column.type = 'text';
        }
        else {
            column.type = 'numeric';
            switch (this.statType) {
            case 'indTotal':
                break;
            default:
                column.numericFormat = {
                    pattern: '0.00',
                    culture: 'en-US',
                };
            }
        }
        return column;
    }

    toTableHeader(col) {
        if (col.notes) {
            return `${col.header} - ${col.notes}`;
        }

        return col.header;
    }

    getTableColumns(side) {
        if (side === 'round') return columns.round.map(col => ({ data: col.data, type: col.data === 'teamName' ? 'text' : 'numeric' }));
        return columns[side].filter(col => this.selectedColumns[side].indexOf(col.data) != -1).map(col => this.toTableColumnFormat(col));
    }

    getTableHeaders(side) {
        if (side === 'round') return columns.round.map(col => this.toTableHeader(col));
        return columns[side].filter(col => this.selectedColumns[side].indexOf(col.data) != -1).map(col => this.toTableHeader(col));
    }
}

export default App;
