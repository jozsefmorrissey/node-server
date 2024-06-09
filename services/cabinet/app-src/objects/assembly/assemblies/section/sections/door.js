
const Assembly = require('../../../assembly.js');
const SectionProperties = require('../section-properties.js');
const Door = require('../../door/door.js');

class DoorSection extends Assembly {
  constructor(door) {
    super('DS');
    const sectionProps = () => instance.parentAssembly();
    const instance = this;
    this.part = () => false;
    this.door = () => door;
    this.pull = (...args) => door && door.pull(...args);
    this.normals({DETERMINE_FROM_PARENT: true});

    if (!door) {
      door = new Door('D', 'Section');
      this.door = () => door;
      this.pull = (i) => door.pull(i);
    }
    door.normals({DETERMINE_FROM_PARENT: true});
    this.addSubAssembly(door);
  }
}

DoorSection.fromJson = (json) => {
  const door = Object.fromJson(json.subassemblies.D);
  return new DoorSection(door);
}

DoorSection.abbriviation = 'drs';
SectionProperties.addSection(DoorSection);

module.exports = DoorSection
