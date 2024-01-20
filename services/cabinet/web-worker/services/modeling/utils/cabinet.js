
const Vertex3D = require('../../../../app-src/three-d/objects/vertex.js');
const Line3D = require('../../../../app-src/three-d/objects/line.js');
const BiPolygon = require('../../../../app-src/three-d/objects/bi-polygon.js');

class CabinetUtil {
  constructor (cabRmdto, env){
    this.subassemblies = cabRmdto.children.map(c => c());

    let partCenter;
    this.partCenter = () => {
      if (!partCenter) {
        const centers = [];
        const subAssems = this.subassemblies.filter(a => !a.id.match(/^(SectionProperties|Auto|Cutter|Void)/));
        for (let index = 0; index < subAssems.length; index++) {
          const assem = subAssems[index];
          centers.push(assem.position.current.center);
        }
        partCenter = Vertex3D.center(...centers);
      }
      return partCenter;
    }

    const depthPartReg = /^Panel/;
    const depthDvReg = /_dv/;
    const depthPartFilter = spDto => spDto.id.match(depthPartReg) &&
                                  !spDto.locationCode.match(depthDvReg);

    let polyInfo;
    this.polyInformation = () => {
      if (polyInfo) return polyInfo;
      let assems = Object.values(env.byId).filter(depthPartFilter);
      const assemblies = []; const polys = [];
      assems.forEach(mDto => {
        try {
          const biPolyArr = env.modelInfo[mDto.id].biPolygonArray;
          const biPoly = new BiPolygon(biPolyArr[0], biPolyArr[1]);
          polys.push(biPoly);
          assemblies.push(mDto);
        } catch (e) {
          console.warn(`toBiPolygon issue with part ${spDto.locationCode}\n`, e);
        }
      });
      polyInfo = {assemblies, polys};
      return polyInfo;
    }

    this.planeIntersection = (line) => {
      const center = this.partCenter();
      const vector = line.vector();
      let closest = {};
      const subAssems = this.subassemblies.filter(a => !a.id.match(/^(Auto|Cutter|Void|SectionProperties)/));

      //Object.values(this.subassemblies).filter(a => !a.constructor.name.match(/Cutter|Void/));
      for (let index = 0; index < subAssems.length; index++) {
        const assem = subAssems[index];
        const sideBiPolyArr = env.modelInfo[assem.id].biPolygonArray;
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

const cabinet = {};
CabinetUtil.instance = (rMdto, environment) => {
  let cabinet = rMdto.find.up('c');
  if (built[cabinet.id] === undefined) {
    built[cabinet.id] = new CabinetUtil(cabinet, environment);
  }
  return built[cabinet.id];
}

module.exports = CabinetUtil;
