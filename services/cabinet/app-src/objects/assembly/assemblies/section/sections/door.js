


const Door = require('../../door/door.js');
const Assembly = require('../../../assembly.js');

class DoorSection extends Assembly {
  constructor(sectionProperties) {
    super();
    if (sectionProperties === undefined) return;
    function center() {
      return sectionProperties.coverInfo().center;
    }
    this.part = () => false;

    function dems() {
      const coverInfo = sectionProperties.coverInfo();
      return {
        x: coverInfo.width,
        y: coverInfo.length,
        z: coverInfo.doorThickness
      }
    }
    const door = new Door('d', 'Door', center, dems, sectionProperties.rotation);
    this.door = () => door;
    this.pull = () => door.pull();
    this.addSubAssembly(door);
  }
}

DoorSection.abbriviation = 'drs';

module.exports = DoorSection
