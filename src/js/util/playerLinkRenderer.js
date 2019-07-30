import Handsontable from 'handsontable';

const playerLinkRenderer = (instance, td, row, col, prop, value, cellProperties) => {
    //Handsontable.renderers.TextRenderer.apply(this, arguments);
    const a = document.createElement('a');
    a.setAttribute('href',`#/profile/${value}`);
    a.innerHTML = value;
    a.onclick = function(e) {
        $('#profile-tab').tab('show');
        document.getElementById('players-select').value = value;
        document.getElementById('players-select').dispatchEvent(new Event('change'));
        return true;
    }
    Handsontable.dom.empty(td);
    td.appendChild(a);
}

export default playerLinkRenderer;