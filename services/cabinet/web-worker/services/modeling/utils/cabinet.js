
const Vertex3D = require('../../../../app-src/three-d/objects/vertex.js');
const Line3D = require('../../../../app-src/three-d/objects/line.js');
const BiPolygon = require('../../../../app-src/three-d/objects/bi-polygon.js');

class CabinetUtil {
  constructor (cabRmdto, modelInfo){
    this.subassemblies = cabRmdto.children.map(c => c());

    this.partCenter = () => {
      const centers = [];
      const subAssems = this.subassemblies.filter(a => !a.id.match(/^(SectionProperties|Auto|Cutter|Void)/));
      for (let index = 0; index < subAssems.length; index++) {
        const assem = subAssems[index];
        centers.push(assem.position.current.center);
      }
      return Vertex3D.center(...centers);
    }

    this.planeIntersection = (line) => {
      const center = this.partCenter();
      const vector = line.vector();
      let closest = {};
      const subAssems = this.subassemblies.filter(a => !a.id.match(/^(Auto|Cutter|Void|SectionProperties)/));

      //Object.values(this.subassemblies).filter(a => !a.constructor.name.match(/Cutter|Void/));
      for (let index = 0; index < subAssems.length; index++) {
        const assem = subAssems[index];
        const sideBiPolyArr = modelInfo.modelInfo[assem.id].biPolygonArray;
        const biPoly = new BiPolygon(sideBiPolyArr[0], sideBiPolyArr[1]);
        const faces = biPoly.closestOrder(center);
        const plane = faces[0].toPlane();
        const intersection = plane.intersection.line(line);
        if (intersection) {
          const dist = line.midpoint().distance(intersection);
          const intersectLine = new Line3D(line.midpoint(), intersection);
          const intersectVector = intersectLine.vector();
          const direction = vector.sameDirection(intersectVector) ? 'positive' : 'negitive';
          if (closest[direction] === undefined || closest[direction].inner.dist > dist) {
            const oplane = faces[1].toPlane();
            plane.intersection.line(line)
            const ointer = oplane.intersection.line(line);
            const odist = ointer.distance(line.midpoint());
            closest[direction] = {assem, inner: {dist, plane, intersection},
            outer: {dist: odist, plane: oplane, intersection: ointer}};
          };
        }
      }
      return closest;
    }
  }
}

module.exports = CabinetUtil;
