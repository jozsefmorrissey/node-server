


const Assembly = require('../assembly.js');

class Frame extends Assembly {
  constructor(partCode, partName, centerConfig, demensionConfig, rotationConfig) {
    super(partCode, partName, centerConfig, demensionConfig, rotationConfig);
  }
}

Frame.abbriviation = 'fr';


module.exports = Frame
