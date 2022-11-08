


const Assembly = require('../assembly.js');

class Divider extends Assembly {
  constructor(partCode, partName, centerConfig, demensionConfig, rotationConfig) {
    super(partCode, partName, centerConfig, demensionConfig, rotationConfig);
  }
}
Divider.count = 0;

Divider.abbriviation = 'dv';

module.exports = Divider
