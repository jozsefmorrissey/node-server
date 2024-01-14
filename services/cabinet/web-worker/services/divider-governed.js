


const BiPolygon = require('../../app-src/three-d/objects/bi-polygon.js');
const Polygon3D = require('../../app-src/three-d/objects/polygon.js');

class DividerGoverned {
  constructor(dividerGovernedDto) {
    const instance = this;

    let governed = dividerGovernedDto.governingSectionId;

    this.toBiPolygon = governed.dividerInfo;
    this.toModel = governed.panelModel;

    this.Full = {
      biPolygon: this.toBiPolygon,
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
      biPolygon: () => {
        builders.front();
        return cutters['f'];
      },
    }

    this.Back.Cutter = {
      biPolygon: () => {
        builders.back();
        return cutters['b'];
      },
    }

    let type = dividerGovernedDto.type;
    let cutter;

    const panels = {};
    const cutters = {};

    function buildPolyCutter(intersected, depth, normal, append, location) {
      const biPoly = instance.toBiPolygon();
      if (biPoly.valid()) {
        intersected.scale(10000,10000);
        const poly = Polygon3D.fromIntersections(intersected, [biPoly.front(), biPoly.back()]);
        poly.scale(10, 10);
        const offsetVect = normal.scale(depth);

        const flip = normal.sameDirection(poly.normal());
        const copy = flip ? poly.reverse() : poly.copy();
        const translated = copy.translate(offsetVect);
        panes[location[0]] = biPoly;
        cutters[location[0]] = new CutterPoly(translated).biPolygon();
      }
    }

    const builders = {
      front: (append) => {
        const intersected = governed.outerPoly();
        const normal = governed.normal();
        buildPolyCutter(intersected, -4 * 2.54, normal, append, 'front');
      },
      back: (append) => {
        const secProps = instance.sectionProperties();
        const biPoly = secProps.back().toBiPolygon()
        const front = biPoly.front().copy();
        const back = biPoly.back().copy();
        const frontDist = front.center().distance(secProps.innerCenter());
        const backDist = back.center().distance(secProps.innerCenter());
        const intersected = backDist > frontDist ? front : back;
        intersected.reverse();
        const openNormal = secProps.normal();
        let normal = secProps.back().toBiPolygon().front().normal();
        if (openNormal.sameDirection(normal)) normal = normal.inverse();
        buildPolyCutter(intersected, -4 * 2.54, normal, append, 'back');
      },
      frontAndBack: () => builders.front() | builders.back(true),
    }
  }
}

const built = {};
DividerGoverned.instance = (openingToeKickDto) => {
  if (built[openingToeKickDto.id] === undefined) {
    built[openingToeKickDto.id] = new DividerGoverned(openingToeKickDto);
  }
  return built[openingToeKickDto.id];
}

module.exports = DividerGoverned
