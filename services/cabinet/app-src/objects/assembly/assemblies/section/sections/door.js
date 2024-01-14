

const SectionProperties = require('../section-properties.js');
const Door = require('../../door/door.js');
const GovernedBySection = require('../governed-by-section');
const DoorGoverned = GovernedBySection.Door;

class DoorSection extends GovernedBySection {
  constructor(door) {
    super('D');
    const sectionProps = () => instance.parentAssembly();
    const instance = this;
    this.part = () => false;

    this.initialize = () => {
      if (!door) {
        door = new DoorGoverned('d', 'Door');
        this.door = () => door;
        this.pull = (i) => door.pull(i);
      }
      door.partName = () => `${sectionProps().partName()}-d`;
      this.addSubAssembly(door);
    }
  }
}

DoorSection.fromJson = (json) => {
  const door = Object.fromJson(json.subassemblies.d);
  return new DoorSection(door);
}

DoorSection.abbriviation = 'drs';
SectionProperties.addSection(DoorSection);

module.exports = DoorSection
