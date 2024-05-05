


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
    this.on.parentSet(p => {
      const props = sectionProps();
      const k = ['OP.i.n.i','OP.i.n.j','OP.i.n.k'];
      const j = ['c.n.y.i','c.n.y.j','c.n.y.k'];
      const normArr = [,j,k];
      normArr.calc = 0;

      rightDoor.normals(true, normArr);
      leftDoor.normals(true, normArr);
    });

  }
}

DualDoorSection.fromJson = (json) => {
  const doorLeft = Object.fromJson(json.subassemblies.Dl);
  const doorRight = Object.fromJson(json.subassemblies.Dr);
  return new DualDoorSection(doorLeft, doorRight);
}


DualDoorSection.abbriviation = 'dds';
SectionProperties.addSection(DualDoorSection);



module.exports = DualDoorSection
