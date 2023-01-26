


const SectionProperties = require('../section-properties.js');
const Door = require('../../door/door.js');
const Handle = require('../../hardware/pull.js');
const Assembly = require('../../../assembly.js');
const Polygon3D = require('../../../../../three-d/objects/polygon.js');
const BiPolygon = require('../../../../../three-d/objects/bi-polygon.js');

class DualDoorSection extends Assembly {
  constructor(leftDoor, rightDoor) {
    super('dds', 'Duel.Door.Section');
    const instance = this;
    const sectionProps = () => instance.parentAssembly();

    this.part = () => false;

    function shrinkPoly(poly, left) {
      const lines = JSON.clone(poly.lines());
      const offset = (lines[0].length() - instance.gap()) / 2;
      if (left) {
        lines[0].adjustLength(offset, true);
        lines[1].startVertex = lines[0].endVertex;
        lines[2].adjustLength(-offset, false);
        lines[1].endVertex = lines[2].startVertex;
      } else {
        lines[0].adjustLength(-offset, false);
        lines[3].endVertex = lines[0].startVertex;
        lines[2].adjustLength(offset, true);
        lines[3].startVertex = lines[2].endVertex;
      }
      return Polygon3D.fromLines(lines);

    }

    function getBiPolygon(left) {
      const fullPoly = sectionProps().coverInfo().biPolygon;
      const front = shrinkPoly(fullPoly.front(), left);
      const back = shrinkPoly(fullPoly.back(), left);
      return new BiPolygon(front, back);
    }

    this.getBiPolygon = (partCode) => {
      return getBiPolygon(partCode === 'dl');
    }

    if (!leftDoor) {
      leftDoor = new Door('dl', 'DoorLeft');
      leftDoor.setPulls([Handle.location.TOP_RIGHT]);
    }
    this.addSubAssembly(leftDoor);
    leftDoor.partName = () => `${sectionProps().partName()}-dl`;
    this.left = () => leftDoor;

    if (!rightDoor) {
      rightDoor ||= new Door('dr', 'DoorRight');
      rightDoor.setPulls([Handle.location.TOP_LEFT]);
    }
    this.addSubAssembly(rightDoor);
    rightDoor.partName = () => `${sectionProps().partName()}-dr`;
    this.right = () => rightDoor;

    this.gap = () => 2.54 / 16;
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
