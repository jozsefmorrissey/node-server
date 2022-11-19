


const Door = require('../../door/door.js');
const Handle = require('../../hardware/pull.js');
const Assembly = require('../../../assembly.js');
const Polygon3D = require('../../../../../three-d/objects/polygon.js');
const BiPolygon = require('../../../../../three-d/objects/bi-polygon.js');

class DualDoorSection extends Assembly {
  constructor(sectionProperties) {
    super('dds', 'Duel.Door.Section');
    if (sectionProperties === undefined) return;
    const instance = this;

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
      return () => {
        const fullPoly = sectionProperties.coverInfo().biPolygon;
        const front = shrinkPoly(fullPoly.front(), left);
        const back = shrinkPoly(fullPoly.back(), left);
        return new BiPolygon(front, back, fullPoly.flipNormal());
      }
    }

    const leftDoor = new Door('dl', 'DoorLeft', getBiPolygon(true));
    this.addSubAssembly(leftDoor);
    leftDoor.setPulls([Handle.location.TOP_RIGHT]);

    const rightDoor = new Door('dr', 'DoorRight', getBiPolygon(false));
    this.addSubAssembly(rightDoor);
    rightDoor.setPulls([Handle.location.TOP_LEFT]);


    this.gap = () => 2.54 / 16;
  }
}


DualDoorSection.abbriviation = 'dds';



module.exports = DualDoorSection
