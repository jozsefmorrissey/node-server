

const SectionProperties = require('../section-properties.js');
const Door = require('../../door/door.js');
const Assembly = require('../../../assembly.js');

class DoorSection extends Assembly {
  constructor(door) {
    super();
    const sectionProps = () => instance.parentAssembly();
    const instance = this;
    this.part = () => false;


    function getBiPolygon () {
      return sectionProps().coverInfo().biPolygon;
    }
    this.getBiPolygon = getBiPolygon;

    if (!door) {
      door = new Door('d', 'Door');
      this.door = () => door;
      this.pull = (i) => door.pull(i);
    }
    door.partName = () => `${sectionProps().partName()}-d`;

    this.addSubAssembly(door);
  }
}

DoorSection.fromJson = (json) => {
  const door = Object.fromJson(json.subassemblies.d);
  return new DoorSection(door);
}

DoorSection.abbriviation = 'drs';
SectionProperties.addSection(DoorSection);

module.exports = DoorSection
