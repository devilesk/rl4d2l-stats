import Handsontable from 'handsontable';
import BaseTab from './base';

class HomeTab extends BaseTab {
    constructor(App, tabId) {
        super(App, tabId);
    }

    getFullTitle() {
        return `RL4D2LBUFF - Reddit Left 4 Dead 2 League Statistics`;
    }

    getRoute() {
        return `${location.pathname}`;
    }
}

export default HomeTab;
