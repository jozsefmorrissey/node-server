


const Assembly = require('../../assembly.js');
const Handle = require('../hardware/pull.js');
const pull = require('../../../../three-d/models/pull.js');


class Door extends Assembly {
  constructor(partCode, partName, coverCenter, coverDems, rotationConfig) {
    super(partCode, partName, coverCenter, coverDems, rotationConfig);
    let pull = new Handle(`${partCode}-dp`, 'Door.Handle', this, Handle.location.LEFT);
    this.pull = () => pull;
    this.addSubAssembly(pull);
  }
}

Door.abbriviation = 'dr';


module.exports = Door
