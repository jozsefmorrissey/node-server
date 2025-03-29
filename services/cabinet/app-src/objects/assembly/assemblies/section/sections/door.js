
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
    this.config.NORMALS.TYPE = this.config.NORMALS.TYPES.PARENT;

    if (!door) {
      door = new Door('D', 'Section');
      this.door = () => door;
      this.pull = (i) => door.pull(i);
    }
    door.config.NORMALS.TYPE = door.config.NORMALS.TYPES.PARENT;
    this.addSubAssembly(door);
  }
}

DoorSection.fromJson = (json) => {
  json.subassemblies.D.parent = true;
  const door = Object.fromJson(json.subassemblies.D);
  return new DoorSection(door);
}

SectionProperties.addSection(DoorSection);

module.exports = DoorSection
