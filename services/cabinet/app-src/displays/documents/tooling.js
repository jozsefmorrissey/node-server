
const Utils = require('./tools/utils');
const $t = require('../../../../../public/js/utils/$t.js');

const templateMap = {};
const getTemplate = (id) => {
  if (templateMap[id] === undefined) templateMap[id] = new $t(`documents/cuts/${id}`);
  return templateMap[id];
}



class ToolingDocumentation {
  constructor(info) {
    this.html = () => {
      if (info.toolingInfo === undefined) {
        const partSuffix = info.parts.length > 1 ? 's:\n' : ':';
        const partList = info.parts.map(p => p.userFriendlyId()).join(', ');
        return `<b class='error'>No Tooling information availible</b>`;
      }
      const toolIds = Object.keys(info.toolingInfo);
      let html = '';
      for (let ti = 0; ti < toolIds.length; ti++) {
        const toolId = toolIds[ti];
        const toolings = info.toolingInfo[toolId];
        const scope = {list: toolings};
        Object.merge(scope, Utils, true);
        html += getTemplate(toolId).render(scope);
      }
      return html;
    }
  }
}

module.exports = ToolingDocumentation;
