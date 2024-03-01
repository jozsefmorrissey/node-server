
const {Task, Sequential, Parrelle} = require('./basic');
const STATUS = require('./status');
const CSG = require('./csg');

class PanelsInformationTask extends Task {
  constructor(parts) {
    super();
    let _result = {};
    const remaining =  parts.map(p => p + '');
    this.result = () => _result;
    this.payload = () => ({parts});
    this.progress = () => Math.floor(100 * (1 - (remaining.length/parts.length)));
    this.on.message((result) => {
      if (result instanceof Error) {
        console.error(result);
      } else {
        remaining.remove(result.partId);
        _result[result.partId] = result;
        this.trigger.change(this);
        if (remaining.length === 0) this.status(STATUS.COMPLETE, _result);
      }
    });
  }
}

function SeqPanels(modelInfo) {
    const buildTask = CSG.Intersection(modelInfo);
    const partTask = new PanelsInformationTask(modelInfo.needsUnioned());
    const sequential = new Sequential(modelInfo.environment, buildTask, partTask);
    sequential.result = partTask.result;
    return sequential;
}

function Panels(modelInfo) {
    const panelTasks = [];
    const partTasks = [];
    const complexityMap = modelInfo.complexityMap();
    let ids = modelInfo.needsUnioned();
    ids.sort((id1, id2) => {
      return complexityMap[id1] - complexityMap[id2];
    });
    const step = Math.ceil(ids.length / 4);
    const slices = [];
    let sliceIndex = 0;
    while (sliceIndex < ids.length) {
      slices.push(ids.slice(sliceIndex, sliceIndex += step));
    }
    ids = [];
    while(slices[0].length) {
      slices.forEach(s => s[0] && ids.push(s.splice(0, 1)));
    }
    for (let index = 0; index < ids.length; index += 4) {
      const buildTask = CSG.Intersection(modelInfo);
      const partTask = new PanelsInformationTask(ids.slice(index, index+4));
      partTasks.push(partTask);
      const sequential = new Sequential(modelInfo.environment, buildTask, partTask);
      panelTasks.push(sequential);
    }
    const parrelle = new Parrelle(...panelTasks);
    parrelle.result = () => {
      let result = {};
      partTasks.forEach(pt => {
        const tRes = pt.result();
        Object.keys(tRes).forEach(k => result[k] = tRes[k]);
      });
      return result;
    }
    return parrelle;
}

module.exports = {
  Panels
};
