
const Assembly = require('../../../assembly.js');
const SectionProperties = require('../section-properties.js');
const Door = require('../../door/door.js');

class DoorSection extends Assembly {
  constructor(door) {
    super('D');
    const sectionProps = () => instance.parentAssembly();
    const instance = this;
    this.part = () => false;
    this.door = () => door;
    this.pull = (...args) => door && door.pull(...args);

    if (!door) {
      door = new Door('d', 'Door');
      door.modelingMethod('Section');
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
