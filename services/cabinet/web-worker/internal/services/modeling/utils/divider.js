


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

    this.Full = {
      biPolygon: () => this.biPolygon,
    }

    this.Back = {
      biPolygon: () => {
        return builders.back();
      },
    }

    this.Front = {
      biPolygon: () => {
        return builders.front();
      },
    }
    this.Right = {
      biPolygon: () => {
        return builders.left();
      },
    }
    this.Left = {
      biPolygon: () => {
        return builders.right();
      },
    }

    this.Front.Cutter = {
      polygon: () => {
        if (cutters['f'] === undefined) builders.front();
        return cutters['f'];
      },
    }

    this.Back.Cutter = {
      polygon: () => {
        if (cutters['b'] === undefined) builders.back();
        return cutters['b'];
      },
    }

    let type = divider.type;
    let cutter;

    const panels = {};
    const cutters = {};

    function buildFrontPoly(position) {
      const biPoly = instance.biPolygon;
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
        case DividerUtil.positions.Back: closerTo = cabUtil.partCenter().translate(zNorm.inverse().scale(100), true); break;
        case DividerUtil.positions.Left: closerTo = cabUtil.partCenter().translate(xNorm.inverse().scale(100), true); break;
        case DividerUtil.positions.Right: closerTo = cabUtil.partCenter().translate(xNorm.scale(100), true); break;
      }

      const sides = biPoly.sides();
      sides.sort((a, b) => a.distance(closerTo) - b.distance(closerTo));
      if (false) polyDrawStrings(cab);
      return BiPolygon.fromPolygon(sides[0], -4 * 2.54, 0);
    }

    const builders = {
      front: (append) => {
        return buildFrontPoly(DividerUtil.positions.FRONT);
      },
      right: (append) => {
        return buildFrontPoly(DividerUtil.positions.Left);
      },
      left: (append) => {
        return buildFrontPoly(DividerUtil.positions.Right);
      },
      back: (append) => {
        return buildFrontPoly(DividerUtil.positions.Back);
      }
    }
  }
}

DividerUtil.positions = {};
DividerUtil.positions.FRONT = 'front';
DividerUtil.positions.Back = 'back';
DividerUtil.positions.Left = 'left';
DividerUtil.positions.Right = 'right';

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
