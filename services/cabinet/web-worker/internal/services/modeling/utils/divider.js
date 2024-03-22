


const BiPolygon = require('../../../../../app-src/three-d/objects/bi-polygon.js');
const Polygon3D = require('../../../../../app-src/three-d/objects/polygon.js');
const Vector3D = require('../../../../../app-src/three-d/objects/vector.js');
const Line3D = require('../../../../../app-src/three-d/objects/line.js');
const SectionPropertiesUtil = require('section-properties');
const CabinetUtil = require('cabinet');
const Utils = require('utils');

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

    const sectionProps = divider.find('S');
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
    this.Back = () => buildPanelPoly(DividerUtil.positions.BACK);
    this.Front = () => buildPanelPoly(DividerUtil.positions.FRONT);
    this.Right = () => buildPanelPoly(DividerUtil.positions.RIGHT);
    this.Left = () => buildPanelPoly(DividerUtil.positions.LEFT);
    this.Front.Cutter = getCutter('f', this.front);
    this.Back.Cutter = getCutter('b', this.back);

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

    function buildPanelPoly(position) {
      const biPoly = instance.Full();
      const cabUtil = CabinetUtil.instance(divider);
      const cab = cabUtil.cabinet();
      const norms = sectionUtils.biPolygon.normals();
      let xNorm = norms.x;
      let zNorm = norms.z;
      if (zNorm.dot(biPoly.normal())  > .5) {
        zNorm = norms.x;
        xNorm = norms.y;
      } else if (Math.abs(biPoly.normal().dot(norms.x))  > .5) {
        xNorm = norms.y;
      }
      if (!xNorm.positive()) xNorm = xNorm.inverse();

      let closerTo;
      switch (position) {
        case DividerUtil.positions.FRONT: closerTo = cabUtil.partCenter().translate(zNorm.scale(100), true); break;
        case DividerUtil.positions.BACK: closerTo = cabUtil.partCenter().translate(zNorm.inverse().scale(100), true); break;
        case DividerUtil.positions.LEFT: closerTo = cabUtil.partCenter().translate(xNorm.inverse().scale(100), true); break;
        case DividerUtil.positions.RIGHT: closerTo = cabUtil.partCenter().translate(xNorm.scale(100), true); break;
      }

      const sides = biPoly.sides();
      sides.sort((a, b) => a.distance(closerTo) - b.distance(closerTo));
      if (false) polyDrawStrings(cab);
      const sc = sectionUtils.biPolygon.center();
      const c = sides[0].center();
      const centerPlusNorm = c.translate(sides[0].normal(), true);
      const multiplier = centerPlusNorm.distance(sc) > c.distance(sc) ? -4 : 4;
      return BiPolygon.fromPolygon(sides[0], multiplier * 2.54, 0);
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
