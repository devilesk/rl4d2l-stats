import Handsontable from 'handsontable';

const boldCellRenderer = function (instance, td, row, col, prop, value, cellProperties) {
    Handsontable.renderers.TextRenderer.apply(this, arguments);
    td.style.fontWeight = 'bold';
}

export default boldCellRenderer;