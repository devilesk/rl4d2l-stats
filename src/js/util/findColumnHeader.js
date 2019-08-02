import columns from '../../data/columns';

const findColumnHeader = (side, header) => columns[side].find(c => c.data == header);
export default findColumnHeader;
