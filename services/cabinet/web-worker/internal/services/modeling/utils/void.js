
const BiPolygon = require('../../../../../app-src/three-d/objects/bi-polygon.js');
const Line3D = require('../../../../../app-src/three-d/objects/line.js');

class VoidUtil {
  constructor(voidDto, env) {
    const panelThickness = 3*2.54/4;
    const pt = panelThickness;
    const instance = this;

    const offsetSets = [
      {
        first: {x: pt, y: pt},
        second: {x: pt*2, y: pt*2},
        third: {x: pt, y: pt*2},
      },
      {
        first: {x: pt, y: pt},
        third: {x: pt*2, y: pt*2},
        second: {x: pt, y: pt*2},
      },


      {
        first: {x: pt, y: pt*2},
        second: {x: pt, y: pt},
        third: {x: pt*2, y: pt*2},
      },
      {
        first: {x: pt*2, y: pt*2},
        second: {x: pt, y: pt},
        third: {x: pt*2, y: pt},
      },


      {
        first: {x: pt*2, y: pt*2},
        second: {x: pt*2, y: pt},
        third: {x: pt, y: pt},
      },
      {
        first: {x: pt*2, y: pt},
        second: {x: pt*2, y: pt*2},
        third: {x: pt, y: pt},
      },
    ]

    this.panel = (index) => {
      return toBiPoly(index);
    }

    const biPolys = [];
    const toBiPoly = (index) => {
      if (biPolys[index]) return biPolys[index];
      const startIndex = voidDto.jointSetIndex;
      const biPoly = instance.biPolygon;
      let polys = biPoly.toPolygons();
      polys.swap(3,4);
      const spliceIndex = Math.mod(startIndex + index, 6);
      const offsetSet = offsetSets[voidDto.jointSetIndex];
      const offset = index < 2 ? offsetSet.first : (index < 4 ? offsetSet.second : offsetSet.third);
      let pt = panelThickness;
      const center = biPoly.center();
      const centerVect = new Line3D(center.copy(), polys[index].center()).vector();

      if (!centerVect.sameDirection(polys[index].normal())) pt *= -1;

      return BiPolygon.fromPolygon(polys[index], pt, 0, offset);
    }

    let abyssBiPoly;
    function abyssBiPolygon() {
      if (abyssBiPoly) return abyssBiPoly;
      const biPoly = instance.biPolygon.copy();
      const polys = biPoly.toPolygons();
      polys.swap(3,4);
      const center = biPoly.center();
      const polyVects = polys.map(p => new Line3D(center.copy(), p.center()).vector().unit());
      for (let index = 0; index < polys.length; index++) {
        const poly = polys[index].copy();
        if (voidDto.includedSides[index] !== true) {
          const vector = polyVects[index];
          biPoly.extend(vector.scale(2000));
        }
      }

      abyssBiPoly = biPoly;
      return abyssBiPoly;
    }

    const current = voidDto.position.current;
    this.biPolygon = BiPolygon.fromPositionObject(current);

    this.abyss = {biPolygon: abyssBiPolygon};
  }
}

const built = {};
VoidUtil.instance = (mDto, environment) => {
  const voidMdto = mDto.parentAssembly();
  const rootHash = mDto.find.root().hash;
  if (built[voidMdto.id] === undefined || built[voidMdto.id].rootHash !== rootHash) {
    built[voidMdto.id] = new VoidUtil(voidMdto, environment);
    built[voidMdto.id].rootHash = rootHash;
  }
  return built[voidMdto.id];
}


module.exports = VoidUtil;
