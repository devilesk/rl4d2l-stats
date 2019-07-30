import columns from '../../data/columns';
const findColumnHeader = (side, header) => columns[side].find(function (c) { return c.data == header });
export default findColumnHeader;