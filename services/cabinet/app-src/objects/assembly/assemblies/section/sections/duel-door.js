


const SectionProperties = require('../section-properties.js');
const Door = require('../../door/door.js');
const Handle = require('../../hardware/pull.js');
const Assembly = require('../../../assembly.js');

class DualDoorSection extends Assembly {
  constructor(leftDoor, rightDoor) {
    super('DD', 'Duel.Door.Section');
    const instance = this;
    const sectionProps = () => instance.parentAssembly();

    this.part = () => false;
    this.left = () => leftDoor;
    this.right = () => rightDoor;
    this.gap = () => 2.54 / 16;

    this.initialize = () => {
      if (!leftDoor) {
        leftDoor = new Door('dl', 'Left');
        leftDoor.setPulls([Handle.location.TOP_RIGHT]);
      }
      leftDoor.partName = () => `${sectionProps().partName()}-dl`;
      this.addSubAssembly(leftDoor);

      if (!rightDoor) {
        rightDoor ||= new Door('dr', 'Right');
        rightDoor.setPulls([Handle.location.TOP_LEFT]);
      }
      this.addSubAssembly(rightDoor);
      rightDoor.partName = () => `${sectionProps().partName()}-dr`;
    }
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
