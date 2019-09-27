import Handsontable from 'handsontable';

const matchIdRenderer = (instance, td, row, col, prop, value, cellProperties) => {
    // Handsontable.renderers.TextRenderer.apply(this, arguments);
    const a = document.createElement('a');
    a.setAttribute('href', `#/match/${value}`);
    a.innerHTML = value;
    a.onclick = function (e) {
        $('#match-tab').tab('show');
        document.getElementById('matches-select').value = value;
        return true;
    };
    Handsontable.dom.empty(td);
    td.appendChild(a);
};

export default matchIdRenderer;
