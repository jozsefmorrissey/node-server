


const Assembly = require('../assembly.js');

class Panel extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
  }
}

Panel.abbriviation = 'pn';


module.exports = Panel
