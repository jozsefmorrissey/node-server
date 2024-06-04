


const BiPolygon = require('../../../../../app-src/three-d/objects/bi-polygon.js');
const Polygon3D = require('../../../../../app-src/three-d/objects/polygon.js');
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

    const sectionProps = divider.find(/_S[0-9]{1,}$/);
    const sectionUtils = SectionPropertiesUtil.instance(sectionProps, env);
    if (!divider.locationCode.match(/_S/)) {
      const dividerBiPoly = env.modelInfo.biPolygonArray[divider.id];
      this.biPolygon = new BiPolygon(dividerBiPoly[0], dividerBiPoly[1]);
    } else {
      this.biPolygon = sectionUtils.dividerInfo();
    }

    let full;
    this.Full = () => {
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
      return full;
    }

    const getCutter = (key, builder) => () => (cutters[key] !== undefined || builder()) && cutters[key];
    this.Frame = buildFramePoly;
    this.Frame.Cutter = getCutter('fr', this.Frame);
    this.Back = (assem, env) => buildPanelPoly(DividerUtil.positions.BACK, assem, env);
    this.Front = (assem, env) => buildPanelPoly(DividerUtil.positions.FRONT, assem, env);
    this.Right = (assem, env) => buildPanelPoly(DividerUtil.positions.RIGHT, assem, env);
    this.Left = (assem, env) => buildPanelPoly(DividerUtil.positions.LEFT, assem, env);

    let type = divider.type;
    let cutter;

    const panels = {};
    const cutters = {};

    function buildFramePoly() {
      const biPoly = instance.biPolygon.copy();
      const cabUtil = CabinetUtil.instance(divider);
      const cab = cabUtil.cabinet();
      const norms = sectionUtils.biPolygon.normals();

      const frontPoly = biPoly.closestPoly(sectionUtils.innerCenter);
      const frameThickness = divider.frameThickness;
      const framePoly = BiPolygon.fromPolygon(frontPoly, 0, -frameThickness);
      const back = framePoly.back();
      cutters['fr'] = back.translate(back.normal().scale(frameThickness/2));
      return framePoly;
    }

    let front, back, left, right, up, down;
    function openingOrientationNormals() {
      const biPoly = instance.Full();
      const cabUtil = CabinetUtil.instance(divider);
      const cab = cabUtil.cabinet();
      const norms = sectionUtils.biPolygon.normals();
      const cabCenter = cabUtil.partCenter();
      const orientNorms = {front: norms.z, back: norms.z.inverse(), right: norms.x, left: norms.x.inverse(), up: norms.y, down: norms.y.inverse()};
      if (back = divider.find('BACK'))
        orientNorms.back = new Line3D(cabCenter, back.position.current.center.object()).vector().unit();
      if (left = divider.find('L'))
        orientNorms.left = new Line3D(cabCenter, left.position.current.center.object()).vector().unit();
      if (right = divider.find('R'))
        orientNorms.right = new Line3D(cabCenter, right.position.current.center.object()).vector().unit();
      return orientNorms;
    }

    function buildPanelPoly(position, assem, env) {
      const csg = env.modelInfo.extended[assem.id];
      const norms = Utils.normals(assem, env);
      const edges = csg.polygons.filter(p => !norms.z.parrelle(new Vector3D(p.plane.normal)));
      const edgePolys = Polygon3D.fromCSG(edges);

      let centerOffsetVector;
      const cabUtil = CabinetUtil.instance(divider);
      const orientNorms = openingOrientationNormals();
      switch (position) {
        case DividerUtil.positions.FRONT: centerOffsetVector = orientNorms.front; break;
        case DividerUtil.positions.BACK: centerOffsetVector = orientNorms.back; break;
        case DividerUtil.positions.LEFT: centerOffsetVector = orientNorms.left; break;
        case DividerUtil.positions.RIGHT: centerOffsetVector = orientNorms.right; break;
      }
      const closerTo = cabUtil.partCenter().translate(centerOffsetVector.scale(100), true)
      const polyDistMap = edgePolys.map((poly, index) => ({dist: poly.distance(closerTo), index, poly}));
      const minDist = polyDistMap.min(p => p.dist).dist + .01;
      const closestPolys = polyDistMap.filter(p => p.dist < minDist);
      const cutterPoly = closestPolys[0].poly;
      const isFrontBack = position === DividerUtil.positions.FRONT ||
                          position === DividerUtil.positions.BACK;
      let vectorObj = {y: norms.z, x: norms.y};
      if (!isFrontBack) vectorObj.x = norms.x;
      const multiplier = !cutterPoly.normal().sameDirection(centerOffsetVector) ? 1 : -1;
      const width = assem.width || divider.partialWidth;
      const cutterBiPoly = BiPolygon.fromPolygon(cutterPoly, multiplier*width,  multiplier*BIG, {x: BIG, y: BIG});

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

const built = {};
DividerUtil.instance = (rMdto, modelMap) => {
  let divider = rMdto.linkListFind('parentAssembly', isDivider);
  const rootHash = rMdto.find.root().hash;
  if (built[divider.id] === undefined || built[divider.id].rootHash !== rootHash) {
    built[divider.id] = new DividerUtil(divider, rMdto, modelMap);
    built[divider.id].rootHash = rootHash;
  }
  return built[divider.id];
}

module.exports = DividerUtil
