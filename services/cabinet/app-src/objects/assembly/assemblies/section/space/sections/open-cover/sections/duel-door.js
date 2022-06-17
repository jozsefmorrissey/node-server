


const OpeningCoverSection = require('../open-cover.js');
const Door = require('../../../../../door/door.js');
const Handle = require('../../../../../hardware/pull.js');
const Assembly = require('../../../../../../assembly.js');

class DualDoorSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(partCode, 'Duel.Door.Section', divideProps, parent);
    if (divideProps === undefined) return;
    const rightDoor = new Door('dr', 'DoorRight', this.duelDoorCenter(), this.duelDoorDems);
    this.addSubAssembly(rightDoor);
    rightDoor.pull().location(Handle.location.TOP_LEFT);

    const leftDoor = new Door('dl', 'DoorLeft', this.duelDoorCenter(true), this.duelDoorDems);
    this.addSubAssembly(leftDoor);
    leftDoor.pull().location(Handle.location.TOP_RIGHT);
  }
}

DualDoorSection.abbriviation = 'dds';


module.exports = DualDoorSection
