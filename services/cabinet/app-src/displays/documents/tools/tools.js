
const TableSawDocumentation = require('./table-saw');
const CutInfo = require('../cuts/cut');
const $t = require('../../../../../../public/js/utils/$t.js');

const tools = {};
tools[TableSawDocumentation.type] = TableSawDocumentation;

class UnknownDocumentation {
  constructor(cut) {
    this.html = () => jointInfo.joint().toString();
    this.type = () => UnknownDocumentation.type;
  }
}

UnknownDocumentation.template = new $t('documents/cuts/unknown');
UnknownDocumentation.render = (list) => UnknownDocumentation.template.render(list);
UnknownDocumentation.type = 'unknown';

const bestTool = (cut) => {
  return  new (tools[cut.toolType()] || tools['unknown'])(cut);
}

class ToolsDocumentation {
  constructor(cuts) {
    let toolCutSets = cuts.map(bestTool).filterSplit(t => t.type());
    this.toolCutSets = () => toolCutSets;

    this.html = () => {
      const keys = Object.keys(toolCutSets);
      let html = '';
      for (let index = 0; index < keys.length; index++) {
        const cuts = toolCutSets[keys[index]].map(o => o);
        cuts.display = CutInfo.display;
        html += cuts[0].constructor.render(cuts);
      }
      return html;
    }
  }
}

module.exports = ToolsDocumentation;
