
const TableSawDocumentation = require('./tools/table-saw');
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
tools[UnknownTool.type] = UnknownTool;


const bestTool = (cut) => {
  if (cut.documented() === false)
    cut.jointInfo().partInfo().cutMade(cut);
  else return  new (tools[cut.toolType()] || tools['unknown'])(cut);
}



class ToolingInformation {
  constructor(cuts) {
    const toolings = cuts.map(bestTool).filter(t => t);
    Object.merge(this, toolings.filterSplit(t => t.type));
  }
}

module.exports = ToolingInformation;
