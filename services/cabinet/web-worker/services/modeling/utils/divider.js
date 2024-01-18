


const BiPolygon = require('../../../../app-src/three-d/objects/bi-polygon.js');
const Polygon3D = require('../../../../app-src/three-d/objects/polygon.js');

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
class Divider {
  constructor(divider, dividerPart, env) {
    const instance = this;

    const dividerInfo = env.modelInfo[divider.id];
    this.biPolygon = new BiPolygon(dividerInfo.biPolygonArray[0], dividerInfo.biPolygonArray[1]);
    this.model = dividerInfo.model.polygons;
    const sectionProps = governingSectionProps(divider);

    this.Full = {
      biPolygon: () => this.biPolygon,
    }

    this.Back = {
      biPolygon: () => {
        builders.back();
        return panels['b'];
      },
    }

    this.Front = {
      biPolygon: () => {
        builders.front();
        return panels['f'];
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

    function buildPolyCutter(intersected, depth, normal, append, location) {
      const biPoly = instance.biPolygon;
      if (biPoly.valid()) {
        intersected.scale(10000,10000);
        const poly = Polygon3D.fromIntersections(intersected, [biPoly.front(), biPoly.back()]);
        poly.scale(10, 10);
        const offsetVect = normal.scale(depth);

        const flip = !normal.sameDirection(poly.normal());
        const copy = flip ? poly.reverse() : poly.copy();
        const translated = copy.translate(offsetVect);
        panels[location[0]] = biPoly;
        cutters[location[0]] = translated;
      }
    }

    const builders = {
      front: (append) => {
        console.log(sectionProps);
        const intersected = sectionProps.coordinates.outer.object();
        const normal = intersected.normal();
        buildPolyCutter(intersected, 4 * 2.54, normal, append, 'front');
      },
      back: (append) => {
        console.log(sectionProps);
        const backMtdo = sectionProps.back();
        const bbpArray = env.modelInfo[backMtdo.id].biPolygonArray;
        const backBiPoly = new BiPolygon(bbpArray[0], bbpArray[1]);
        const front = backBiPoly.front().copy();
        const back = backBiPoly.back().copy();
        const innerPoly = sectionProps.coordinates.inner.object();
        const frontDist = front.center().distance(innerPoly.center());
        const backDist = back.center().distance(innerPoly.center());
        const intersected = backDist > frontDist ? front : back;
        intersected.reverse();
        const openNormal = innerPoly.normal();
        let normal = backBiPoly.front().normal();
        if (openNormal.sameDirection(normal)) normal = normal.inverse();
        buildPolyCutter(intersected, 4 * 2.54, normal, append, 'back');
      }
    }
  }
}

const built = {};
Divider.instance = (rMdto, modelMap) => {
  let divider = rMdto.linkListFind('parentAssembly', isDivider);
  if (built[divider.id] === undefined) {
    built[divider.id] = new Divider(divider, rMdto, modelMap);
  }
  return built[divider.id];
}

module.exports = Divider
