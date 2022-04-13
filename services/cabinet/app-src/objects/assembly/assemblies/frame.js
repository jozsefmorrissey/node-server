


const Assembly = require('../assembly.js');

class Frame extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
  }
}

Frame.abbriviation = 'fr';


module.exports = Frame
