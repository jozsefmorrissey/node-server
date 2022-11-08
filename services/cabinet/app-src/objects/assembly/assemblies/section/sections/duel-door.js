


const Door = require('../../door/door.js');
const Handle = require('../../hardware/pull.js');
const Assembly = require('../../../assembly.js');

class DualDoorSection extends Assembly {
  constructor(sectionProperties) {
    super('dds', 'Duel.Door.Section');
    if (sectionProperties === undefined) return;



    function center() {
      return sectionProperties.coverInfo().center;
    }
    this.part = () => false;

    function duelDoorCenter(right) {
      return function () {
        const direction = right ? -1 : 1;
        const doorGap = 2.54/16
        const coverInfo = sectionProperties.coverInfo();
        let center = coverInfo.center;
        const dems = duelDoorDems();
        center = sectionProperties.offsetPoint(center, (dems.x + doorGap) / 2 * direction, 0, 0);
        return center;
      }
    }

    function duelDoorDems() {
      const coverInfo = sectionProperties.coverInfo();
      const doorGap = 2.54/16
      return {
        x: (coverInfo.width - doorGap)/2,
        y: coverInfo.length,
        z: coverInfo.doorThickness
      }
    }

    const rightDoor = new Door('dr', 'DoorRight', duelDoorCenter(), duelDoorDems, sectionProperties.rotation);
    this.addSubAssembly(rightDoor);
    rightDoor.pull().location(Handle.location.TOP_LEFT);

    const leftDoor = new Door('dl', 'DoorLeft', duelDoorCenter(true), duelDoorDems, sectionProperties.rotation);
    this.addSubAssembly(leftDoor);
    leftDoor.pull().location(Handle.location.TOP_RIGHT);
  }
}


DualDoorSection.abbriviation = 'dds';



module.exports = DualDoorSection
