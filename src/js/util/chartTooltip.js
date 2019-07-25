export const openTooltip = (oChart,datasetIndex,pointIndex) => {
    if(oChart.tooltip._active == undefined) oChart.tooltip._active = [];
    const activeElements = oChart.tooltip._active;
    const requestedElem = oChart.getDatasetMeta(datasetIndex).data[pointIndex];
    for (let i = 0; i < activeElements.length; i++) {
        if (requestedElem._index == activeElements[i]._index) return;
    }
    activeElements.push(requestedElem);
    oChart.tooltip._active = activeElements;
    oChart.tooltip.update(true);
    oChart.draw();
}

export const closeTooltip = (oChart,datasetIndex,pointIndex) => {
    const activeElements = oChart.tooltip._active;
    if (activeElements == undefined || activeElements.length == 0) return;
    const requestedElem = oChart.getDatasetMeta(datasetIndex).data[pointIndex];
    for (let i = 0; i < activeElements.length; i++) {
        if (requestedElem._index == activeElements[i]._index)  {
            activeElements.splice(i, 1);
            break;
        }
    }
    oChart.tooltip._active = activeElements;
    oChart.tooltip.update(true);
    oChart.draw();
}

export default { openTooltip, closeTooltip }