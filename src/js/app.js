import formatDate from './util/formatDate';
import getJSON from './util/getJSON';
import timestamps from '../../public/data/timestamps';
import Promise from 'bluebird';
import LeagueTab from './tabs/league';
import RankingsTab from './tabs/rankings';
import ProfileTab from './tabs/profile';
import MatchesTab from './tabs/matches';
import MatchTab from './tabs/match';
import TeamgenTab from './tabs/teamgen';
import RecordsTab from './tabs/records';
import MatchupsTab from './tabs/matchups';
import HomeTab from './tabs/home';
import EventEmitter from 'eventemitter3';
import './chartjs-plugin-colorschemes';

class App extends EventEmitter {
    constructor() {
        super();
        
        const self = this;
        this.profileTrendData = {};
        this.leagueData = {};
        this.matchData = {};
        this.playerData = {};
        this.sides = ['survivor', 'infected'];
        this.statType = $('input:radio[name="stat_type"]:checked').val();
        this.wlStatType = $('input:radio[name="wl_stat_type"]:checked').val();
        this.matchupType = $('input:radio[name="matchup_type"]:checked').val();
        this.wlType = $('input:radio[name="wl_type"]:checked').val();
        this.dmgType = $('input:radio[name="dmg_type"]:checked').val();
        this.dmgAggregationType = $('input:radio[name="dmg_aggr_type"]:checked').val();
        this.selectedColumns = {
            survivor: Array.from(document.querySelectorAll('input[name=survivor-columns]:checked')).map(el => el.value),
            infected: Array.from(document.querySelectorAll('input[name=infected-columns]:checked')).map(el => el.value)
        }
        this.selectedSide = $('input:radio[name="side"]:checked').val();
        this.selectedLeagueMatchId = document.getElementById('league-matches-select').value;
        this.latestLeagueMatchId = document.getElementById('league-matches-select').value;
        
        this.init();
        
        if (location.hash.startsWith('#/profile/')) {
            history.replaceState(null, null, `${location.pathname}#/profile/${this.selectedSteamId}`);
        }
        else if (location.hash.startsWith('#/match/')) {
            history.replaceState(null, null, `${location.pathname}#/match/${this.selectedMatchId}`);
        }

        document.getElementById('players-select').addEventListener('change', e => {
            this.selectedSteamId = e.target.value;
            this.profileTab.updateRoute();
        });

        document.getElementById('matches-select').addEventListener('change', e => {
            this.selectedMatchId = e.target.value;
            this.matchTab.updateRoute();
        });
        
        this.homeTab = new HomeTab(this, 'home-tab');
        this.rankingsTab = new RankingsTab(this, 'rankings-tab');
        this.leagueTab = new LeagueTab(this, 'league-tab');
        this.matchupsTab = new MatchupsTab(this, 'matchups-tab');
        this.matchesTab = new MatchesTab(this, 'matches-tab');
        this.matchTab = new MatchTab(this, 'match-tab');
        this.recordsTab = new RecordsTab(this, 'records-tab');
        this.profileTab = new ProfileTab(this, 'profile-tab');
        this.teamgenTab = new TeamgenTab(this, 'teamgen-tab');

        // show initial tab
        if (location.hash) {
            const tabId = location.hash.split("#")[1].split('/')[1];
            if (tabId) {
                $(`#${tabId}-tab`).tab("show");
            }
        }
        
        // side change handler
        $(document).on('change', 'input:radio[name="side"]', function (event) {
            self.selectedSide = $(this).val();
            self.updateSideVisibility();
            self.emit('sideChanged');
        });
        
        // tab change handler
        $('a[data-toggle="tab"]').on('shown.bs.tab', (e) => {
            this.showTab(e.target.id)
        });
        
        window.addEventListener('popstate', (event) => {
            const tabName = location.hash ? location.hash.split("#")[1].split('/')[1] : 'home';
            if (tabName) {
                this.init();
                $('.nav-link').blur();
                $(`#${tabName}-tab`).tab("show");
                this.emit(`${tabName}-tab.refresh`);
            }
        });
    }
    
    init() {
        const steamId = location.hash.split('#/profile/')[1] || localStorage.getItem('steamid');
        if (!document.querySelector(`#players-select [value="${steamId}"]`)) {
                localStorage.removeItem('steamid');
        }
        else {
            localStorage.setItem('steamid', steamId);
            document.getElementById('players-select').value = steamId;
        }
        this.selectedSteamId = document.getElementById('players-select').value;
        
        const matchId = parseInt(location.hash.split('#/match/')[1]);
        if (!isNaN(matchId) && document.querySelector(`#matches-select [value="${matchId}"]`)) {
            document.getElementById('matches-select').value = matchId;
        }
        this.selectedMatchId = document.getElementById('matches-select').value;
    }
    
    showTab(tabId) {
        for (const side of this.sides) {
            $(`.${side}-columns-container`).hide();
            if (tabId === side+'-tab') {
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
        const side = $('input:radio[name="side"]:checked').val();
        if (side === 'survivor') {
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
            this.matches = getJSON(`/data/matches.json?t=${timestamps.matches}`);
        }
        return this.matches.then(matches => {
            for (const row of matches.data) {
                row.push(formatDate(new Date(row[0] * 1000)));
            }
            matches.headers.push('Date');
            return matches;
        });
    }
    
    async getDamageMatrix() {
        if (!this.damageMatrix) {
            this.damageMatrix = getJSON(`/data/damageMatrix.json?t=${timestamps.damageMatrix}`);
        }
        return this.damageMatrix;
    }
    
    async getWlMatrix() {
        if (!this.wlMatrix) {
            this.wlMatrix = getJSON(`/data/wlMatrix.json?t=${timestamps.wlMatrix}`);
        }
        return this.wlMatrix;
    }
    
    async getPlayerMapWL() {
        if (!this.playerMapWL) {
            this.playerMapWL = getJSON(`/data/playerMapWL.json?t=${timestamps.playerMapWL}`);
        }
        return this.playerMapWL;
    }
    
    async getPlayers() {
        if (!this.players) {
            this.players = getJSON(`/data/players.json?t=${timestamps.players}`);
        }
        return this.players;
    }
    
    async getTeamgen() {
        return getJSON(`/data/teamgen.json?t=${Date.now()}`);
    }
    
    async getPlayerData(steamId) {
        if (!this.playerData[steamId]) {
            console.log('[App] making request');
            this.playerData[steamId] = getJSON(`/data/players/${steamId}.json?t=${timestamps.matches}`);
        }
        else {
            console.log('[App] not making request');
        }
        return this.playerData[steamId].catch(e => {
            console.log('[App] not found, deleting');
            delete this.playerData[steamId];
            return null;
        });
    }
    
    async getMatchData(matchId) {
        if (!this.matchData[matchId]) {
            this.matchData[matchId] = getJSON(`/data/matches/${matchId}.json?t=${timestamps.matches}`);
        }
        return this.matchData[matchId];
    }
    
    async getSelectedMatchData(matchId) {
        return getMatchData(this.selectedMatchId);
    }
    
    async getLeagueData(matchId) {
        if (!this.leagueData[matchId]) {
            this.leagueData[matchId] = getJSON(`/data/league/${matchId}.json?t=${timestamps.matches}`);
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
}

export default App;