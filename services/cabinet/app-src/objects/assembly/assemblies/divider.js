


const Assembly = require('../assembly.js');

class Divider extends Assembly {
  constructor(partCode, partName, toModel) {
    super(partCode, partName);

    this.toModel = toModel;
  }
}
Divider.count = 0;

Divider.abbriviation = 'dv';

module.exports = Divider
