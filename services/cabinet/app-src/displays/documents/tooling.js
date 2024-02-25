
const Utils = require('./tools/utils');
const $t = require('../../../../../public/js/utils/$t.js');

const templateMap = {};
const getTemplate = (id) => {
  if (templateMap[id] === undefined) templateMap[id] = new $t(`documents/cuts/${id}`);
  return templateMap[id];
}

class ToolingDocumentation {
  constructor(toolingMap) {
    this.html = () => {
      const toolIds = Object.keys(toolingMap);
      let html = '';
      for (let ti = 0; ti < toolIds.length; ti++) {
        const toolId = toolIds[ti];
        const toolings = toolingMap[toolId];
        const scope = {list: toolings};
        Object.merge(scope, Utils, true);
        html += getTemplate(toolId).render(scope);
      }
      return html;
    }
  }
}

module.exports = ToolingDocumentation;
