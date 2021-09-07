


const Assembly = require('../../assembly.js');
const Handle = require('../hardware/pull.js');
const pull = require('../../../../three-d/models/pull.js');


class Door extends Assembly {
  constructor(partCode, partName, coverCenter, coverDems, rotationStr) {
    super(partCode, partName, coverCenter, coverDems, rotationStr);
    let location = Handle.location.TOP_RIGHT;
    let pull = new Handle(`${partCode}-dp`, 'Door.Handle', this, location);
    this.setHandleLocation = (l) => location = l;
    this.addSubAssembly(pull);
  }
}

Door.abbriviation = 'dr';

Assembly.register(Door);
module.exports = Door




