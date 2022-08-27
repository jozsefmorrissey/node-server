


const Assembly = require('../assembly.js');

class Cutter extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
    this.included(false);
  }
}
Cutter.abbriviation = 'cut';

module.exports = Cutter;
