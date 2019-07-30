class BaseTab {
    constructor(App, tabId) {
        this.App = App;
        this.initialized = false;
        this.tabId = tabId;
        $('a[data-toggle="tab"]').on('shown.bs.tab', (e) => {
            if (e.target.id === this.tabId) {
                if (this.initialized) {
                    this.onTabShow();
                }
                else {
                    this.init();
                }
                $('.columns-filter-container').collapse('hide');
            }
        });
        $('a[data-toggle="tab"]').click((e) => {
            if (e.target.id === this.tabId) {
                this.updateRoute();
            }
        });
        this.App.on(`${this.tabId}.refresh`, () => {
            this.refresh();
        });
    }
    
    getTitle() {
        return document.getElementById(this.tabId).innerHTML;
    }
    
    getFullTitle() {
        return `${this.getTitle()} - RL4D2LBUFF - Reddit Left 4 Dead 2 League Statistics`;
    }
    
    getRoute() {
        return `${location.pathname}#/${this.tabId.replace('-tab', '')}`;
    }
    
    updateRoute() {
        history.pushState(null, null, this.getRoute());
        document.title = this.getFullTitle();
    }
    
    async refresh() {}
    
    onTabShow() {}
    
    async init() {
        this.initialized = true;
    }
}

export default BaseTab;