


const Door = require('../../door/door.js');
const Handle = require('../../hardware/pull.js');
const Assembly = require('../../../assembly.js');

class DualDoorSection extends Assembly {
  constructor(sectionProperties) {
    super('dds', 'Duel.Door.Section');
    if (sectionProperties === undefined) return;
    const instance = this;



    this.part = () => false;

    function duelDoorCenter(right) {
      return function () {
        const cabinet = sectionProperties.getAssembly('c');
        if (cabinet)
          cabinet.openings[0].update();
        let direction = sectionProperties.vertical() ? 1 : -1;
        direction *= right ? 1 : -1;
        const doorGap = 2.54/16
        const coverInfo = sectionProperties.coverInfo();
        let center = JSON.copy(coverInfo.center);
        const dems = duelDoorDems();
        const xOffset = (dems.x + doorGap) / 2 * direction;
        const rotation = sectionProperties.rotation();
          rotation.x += 180;
          rotation.y += 180;
          rotation.z += 180;
        center = sectionProperties.transRotate(center, {z:0, y:0, x:xOffset}, rotation);
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
