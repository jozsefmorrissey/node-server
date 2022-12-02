

const SectionProperties = require('../section-properties.js');
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
    this.pull = (i) => door.pull(i);
    door.partName = () => `${sectionProperties.partName()}-d`;

    this.addSubAssembly(door);
  }
}

DoorSection.abbriviation = 'drs';
SectionProperties.addSection(DoorSection);

module.exports = DoorSection
