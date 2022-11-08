


const Assembly = require('../assembly.js');

class Cutter extends Assembly {
  constructor(partCode, partName, centerConfig, demensionConfig, rotationConfig) {
    super(partCode, partName, centerConfig, demensionConfig, rotationConfig);
    this.included(false);
  }
}
Cutter.abbriviation = 'cut';

module.exports = Cutter;
