


const SectionProperties = require('../section-properties.js');
const Door = require('../../door/door.js');
const Handle = require('../../hardware/pull.js');
const Assembly = require('../../../assembly.js');

class DualDoorSection extends Assembly {
  constructor(leftDoor, rightDoor) {
    super('DDS', 'Duel.Door.Section');
    const instance = this;
    const sectionProps = () => instance.parentAssembly();

    this.part = () => false;
    this.left = () => leftDoor;
    this.right = () => rightDoor;
    this.gap = () => 2.54 / 16;

    if (!leftDoor) {
      leftDoor = new Door('Dl', 'Left');
      leftDoor.setPulls([Handle.location.TOP_RIGHT]);
    }
    this.addSubAssembly(leftDoor);

    if (!rightDoor) {
      rightDoor ||= new Door('Dr', 'Right');
      rightDoor.setPulls([Handle.location.TOP_LEFT]);
    }
    this.addSubAssembly(rightDoor);
  }
}

DualDoorSection.fromJson = (json) => {
  const doorLeft = Object.fromJson(json.subassemblies.dl);
  const doorRight = Object.fromJson(json.subassemblies.dr);
  return new DualDoorSection(doorLeft, doorRight);
}


DualDoorSection.abbriviation = 'dds';
SectionProperties.addSection(DualDoorSection);



module.exports = DualDoorSection
