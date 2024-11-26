


const BiPolygon = require('../../../../../app-src/three-d/objects/bi-polygon.js');
const Polygon3D = require('../../../../../app-src/three-d/objects/polygon.js');
const Vertex3D = require('../../../../../app-src/three-d/objects/vertex.js');
const Vector3D = require('../../../../../app-src/three-d/objects/vector.js');
const Line3D = require('../../../../../app-src/three-d/objects/line.js');
const SectionPropertiesUtil = require('section-properties');
const CabinetUtil = require('cabinet');
const Utils = require('utils');

const BIG = 10000000;
const isSectionProps = (pa) => pa.id.match(/^SectionProperties_/);
const isDivider = (pa) => pa.id.match(/^Divider_/);
const isRoot = (pa) => pa.parentAssembly === undefined;

const governingSectionProps = (divider) => {
  const sectionProps = divider.linkListFind('parentAssembly', isSectionProps);
  if (sectionProps) return sectionProps;
  const root = divider.linkListFind('parentAssembly', isRoot);
  const sectionPropsGetter = root.linkListFind('children', (funcOobj) =>
    funcOobj instanceof Function ? isSectionProps(funcOobj()) : isSectionProps(funcOobj));
  return sectionPropsGetter();
}

// console.log(dividerPoly.toDrawString('red') + '\n\n' + furtherPoly.toDrawString('blue') + '\n\n' + biPoly.toDrawString('green'))
// console.log(ic.toString() + '\nred' + furtherPoly.center().toString() + '\ngreen' + biPoly.center().toString())

class DividerUtil {
  constructor(divider, dividerPart, env) {
    const instance = this;

    const sectionProps = divider.find(/_S$/);
    const sectionUtils = SectionPropertiesUtil.instance(sectionProps, env);
    if (!divider.locationCode.match(/_S/)) {
      const dividerBiPoly = env.modelInfo.biPolygonArray[divider.id];
      this.biPolygon = new BiPolygon(dividerBiPoly[0], dividerBiPoly[1]);
    } else {
      this.biPolygon = sectionUtils.dividerInfo();
    }

    const fromInner = (dist) => divider.position.current.demension.z - divider.panelThickness - dist;

    let full;
    function scribeRevealOffset(assem) {
      let offset = 0;
      switch (assem.partCode.replace(/^(.*?):.*$/, '$1')) {
        case 'T': offset = Utils.property('tid', assem, env); break;
        case 'B': offset = fromInner(Utils.property('rvibr', assem, env)); break;
        case 'R': offset = Utils.property('dsc', assem, env); break;
        case 'L': offset = Utils.property('dsc', assem, env); break;
      }
      const cabCenter = CabinetUtil.instance(assem, env).partCenter();
      const toCentVect = new Line3D(full.center(), cabCenter).vector();
      const norms = Utils.normals(assem, env);
      const unitVect = norms.z.sameDirection(toCentVect) ? norms.z : norms.z.inverse();
      const poly = full.copy();
      poly.translate(unitVect.scale(offset));
      return poly;
    }

    this.Full = (assem) => {
      if (!full) {
        const ic = sectionUtils.innerCenter;
        const dividerPoly = instance.biPolygon.copy();
        const furtherPoly = dividerPoly.furthestOrder(ic)[0];
        const fc = furtherPoly.center();
        const movedNormDist = fc.translate(furtherPoly.normal(), true);
        const multiplier = movedNormDist.distance(ic) < fc.distance(ic) ? 1 : -1;
        const biPoly = BiPolygon.fromPolygon(furtherPoly.copy(), multiplier * divider.panelThickness, 0);
        biPoly.translate(furtherPoly.normal().scale(multiplier*divider.scribe));

        full = biPoly;
      }
      if (assem && divider.hasFrame)
          return scribeRevealOffset(assem);
      return full;
    }

    const getCutter = (key, builder) => () => (cutters[key] !== undefined || builder()) && cutters[key];
    this.Frame = buildFramePoly;
    this.Back = (assem, env) => cropExtendedFrom(DividerUtil.positions.BACK, assem.width || divider.partialWidth, assem, env);
    this.Front = (assem, env) => cropExtendedFrom(DividerUtil.positions.FRONT, assem.width || divider.partialWidth, assem, env);
    this.Right = (assem, env) => cropExtendedFrom(DividerUtil.positions.RIGHT, assem.width || divider.partialWidth, assem, env);
    this.Left = (assem, env) => cropExtendedFrom(DividerUtil.positions.LEFT, assem.width || divider.partialWidth, assem, env);

    let type = divider.type;
    let cutter;

    const panels = {};

    function buildFramePoly(frame) {
      const bottomFrontLine = sectionUtils.innerPoly.lines()[0];
      const bottomBackLine = bottomFrontLine.clone();
      bottomBackLine.translate(sectionUtils.normal().scale(-divider.frameThickness));
      const bottomPoly = new Polygon3D([bottomFrontLine[0], bottomFrontLine[1], bottomBackLine[1], bottomBackLine[0]]);
      const framePoly = BiPolygon.fromPolygon(bottomPoly, 0, divider.frameWidth);
      // frame.position.current.normals.z = sectionUtils.normal();

      return framePoly;
    }

    const normRelitiveToCenter = (center, assem) => {
      const direction = new Line3D(center, assem.position.current.center.object()).vector();
      const z = Utils.normals(assem).z;
      return direction.dot(z) > 0 ? z : z.inverse();
    }

    let front, back, left, right, up, down;
    function openingOrientationNormals() {
      const biPoly = instance.Full();
      const cabUtil = CabinetUtil.instance(divider, env);
      const cab = cabUtil.cabinet();
      const norms = sectionUtils.biPolygon.normals();
      const cabCenter = cabUtil.partCenter();
      const orientNorms = {front: norms.z, back: norms.z.inverse(), right: norms.x, left: norms.x.inverse(), up: norms.y, down: norms.y.inverse()};
      if (back = divider.find('BACK')) orientNorms.back = normRelitiveToCenter(cabCenter, back);
      if (left = divider.find('L')) orientNorms.left = normRelitiveToCenter(cabCenter, left);
      if (right = divider.find('R')) orientNorms.right = normRelitiveToCenter(cabCenter, right);
      if (up = divider.find('T')) orientNorms.up = normRelitiveToCenter(cabCenter, up);
      if (down = divider.find('B')) orientNorms.down = normRelitiveToCenter(cabCenter, down);
      return orientNorms;
    }

    function cropExtendedFrom(position, distance, assem, env) {
      const csg = env.getModel(assem, 'cut');
      if (csg.polygons.length === 0) {
        console.warn.logarithmic('model has been completely removed, may not be intentional');
        return csg;
      }
      const norms = Utils.normals(assem, env);
      const edges = csg.polygons.filter(p => !norms.z.parrelle(new Vector3D(p.plane.normal)));
      const edgePolys = Polygon3D.merge(Polygon3D.fromCSG(edges));

      let centerOffsetVector;
      const cabUtil = CabinetUtil.instance(divider, env);
      const orientNorms = openingOrientationNormals();
      switch (position) {
        case DividerUtil.positions.FRONT: centerOffsetVector = orientNorms.front; break;
        case DividerUtil.positions.BACK:
          centerOffsetVector = orientNorms.back; break;
        case DividerUtil.positions.LEFT: centerOffsetVector = orientNorms.left; break;
        case DividerUtil.positions.RIGHT: centerOffsetVector = orientNorms.right; break;
      }
      const cabCenter = cabUtil.partCenter();
      const closerTo = cabCenter.translate(centerOffsetVector.scale(100), true);
      const connections = edgePolys.map(e => new Line3D(closerTo, e.center()).viewFromVector(norms.z));
      const mi = Vertex3D.mostInformation(connections.map(l => l[1]));
      const polyDistMap = edgePolys.map((poly, index) => ({
        dist: connections[index].to2D(mi[0], mi[1]).length(),
        connect: connections[index],
        twoD: connections[index].to2D(mi[0], mi[1]),
        index, poly}));

      const minDist = polyDistMap.min(p => p.dist).dist + .01;
      const closestPolys = polyDistMap.filter(p => p.dist < minDist);
      const cutterPoly = closestPolys[0].poly;
      const multiplier = 1;//cutterPoly.normal().sameDirection(centerOffsetVector) ? 1 : -1;
      const width = assem.width || divider.partialWidth;
      const cutterBiPoly = BiPolygon.fromPolygon(cutterPoly, -BIG, -width, {x: BIG, y: BIG});

      return csg.subtract(cutterBiPoly.model());
    }
  }
}

DividerUtil.positions = {};
DividerUtil.positions.FRAME = 'front';
DividerUtil.positions.FRONT = 'front';
DividerUtil.positions.BACK = 'back';
DividerUtil.positions.LEFT = 'left';
DividerUtil.positions.RIGHT = 'right';

const dataPath = (assem) => 'proccessData.DividerUtil.built.' + assem.id;
DividerUtil.instance = (rMdto, env) => {
  let divider = rMdto.linkListFind('parentAssembly', isDivider);
  const rootHash = rMdto.find.root().hash;
  const path = dataPath(divider);
  if (env.pathValue(path) === undefined || env.pathValue(path).rootHash !== rootHash) {
    const divUtil = new DividerUtil(divider, rMdto, env);
    divUtil.rootHash = rootHash;
    env.pathValue(path, divUtil);
  }
  return env.pathValue(path);
}

module.exports = DividerUtil
