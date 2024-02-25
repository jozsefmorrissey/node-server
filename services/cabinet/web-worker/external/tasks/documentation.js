
const {Task, Sequential} = require('./basic');
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

function Panels(modelInfo) {
    const buildTask = CSG.Intersection(modelInfo);
    const partTask = new PanelsInformationTask(modelInfo.needsUnioned());
    const sequential = new Sequential(modelInfo.environment, buildTask, partTask);
    sequential.result = partTask.result;
    return sequential;
}

module.exports = {
  Panels
};
