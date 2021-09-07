


const OpeningCoverSection = require('../open-cover.js');
const Door = require('../../../../../door/door.js');
const Handle = require('../../../../../hardware/pull.js');
const Assembly = require('../../../../../../assembly.js');

class DualDoorSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(sectionFilePath('dual-door'), partCode, 'Duel.Door.Section', divideProps);
    if (divideProps === undefined) return;
    const rightDoor = new Door('dr', 'DoorRight', this.duelDoorCenter(true), this.duelDoorDems);
    this.addSubAssembly(rightDoor);
    rightDoor.setHandleLocation(Handle.location.TOP_LEFT);

    const leftDoor = new Door('dl', 'DoorLeft', this.duelDoorCenter(), this.duelDoorDems);
    this.addSubAssembly(leftDoor);
    leftDoor.setHandleLocation(Handle.location.TOP_RIGHT);
  }
}

DualDoorSection.abbriviation = 'dds';

Assembly.register(DualDoorSection);
module.exports = DualDoorSection




