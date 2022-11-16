


const Door = require('../../door/door.js');
const Assembly = require('../../../assembly.js');

class DoorSection extends Assembly {
  constructor(sectionProperties) {
    super();
    if (sectionProperties === undefined) return;
    const instance = this;
    this.part = () => false;


    function getBiPolygon () {
      return sectionProperties.coverInfo().biPolygon;
    }

    const door = new Door('d', 'Door', getBiPolygon);
    this.door = () => door;
    this.pull = () => door.pull();
    this.addSubAssembly(door);
  }
}

DoorSection.abbriviation = 'drs';

module.exports = DoorSection
