


const Assembly = require('../assembly.js');

class Cutter extends Assembly {
  constructor(partCode, partName, centerConfig, demensionConfig, rotationConfig) {
    super(partCode, partName, centerConfig, demensionConfig, rotationConfig);
    this.included(false);
  }
}
Cutter.abbriviation = 'cut';

class CutterModel extends Cutter {
  constructor(partCode, partNameFunc, toModel) {
    super(partCode);
    this.toModel = toModel;
    this.partName = partNameFunc;
  }
}

Cutter.Model = CutterModel;

module.exports = Cutter;
