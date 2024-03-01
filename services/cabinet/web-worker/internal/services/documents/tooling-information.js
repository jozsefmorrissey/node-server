
const TableSawDocumentation = require('./tools/table-saw');
const HandSawDocumentation = require('./tools/hand-saw');
const CutInfo = require('./cuts/cut');

class UnknownTool {
  constructor(cut) {
    this.cut = () => cut;
    this.type = UnknownTool.type;
  }
}

UnknownTool.type = 'unknown';


const tools = {};
tools[TableSawDocumentation.type] = TableSawDocumentation;
tools[HandSawDocumentation.type] = HandSawDocumentation;
tools[UnknownTool.type] = UnknownTool;


const bestTool = (cut) => {
  try {
    if (cut.documented() === false)
    cut.jointInfo().partInfo().cutMade(cut);
    else return  new (tools[cut.toolType] || tools['unknown'])(cut);
  } catch (e) {
      if (tools[e.message]) {
        cut.toolType = e.message;
      } else {
        if (cut.toolType === 'unknown') throw e;
        cut.toolType = 'unknown';
        console.warn(e);
      }
      return bestTool(cut);
  }
}



class ToolingInformation {
  constructor(cuts) {
    const toolings = cuts.map(bestTool).filter(t => t);
    Object.merge(this, toolings.filterSplit(t => t.type));
  }
}

module.exports = ToolingInformation;
