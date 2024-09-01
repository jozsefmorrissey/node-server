
const BiPolygon = require('../../../../../app-src/three-d/objects/bi-polygon.js');
const Line3D = require('../../../../../app-src/three-d/objects/line.js');
const Polygon3D = require('../../../../../app-src/three-d/objects/polygon.js');
const Vertex3D = require('../../../../../app-src/three-d/objects/vertex.js');
const Plane = require('../../../../../app-src/three-d/objects/plane.js');

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

    const innerPolys = [];
    const outerPolys = [];
    const biPolys = [];
    const toBiPoly = (panel, env) => {
      const biPoly = instance.biPolygon;
      const center = biPoly.center();
      const vectors = panel.vectors;
      const dems =   voidDto.position.current.demension;
      const outterFaceCenter = center.translate(vectors.z, true);
      const width = vectors.x
      const outerPoly = Polygon3D.fromMagintudeObject(vectors, outterFaceCenter);
      const innerOffsetVector = vectors.z.unit().inverse().scale(panel.width);
      const innerPoly = outerPoly.translate(innerOffsetVector).reverse();
      outerPolys[panel.index] = outerPoly;
      innerPolys[panel.index] = innerPoly;

      return new BiPolygon(outerPoly, innerPoly);
    }

    let abyssBiPoly;
    function abyssModel() {
      const defined = innerPolys.filter(p=>p);
      const center = Polygon3D.midRange(...defined);
      const polys = Polygon3D.fromPlanes(defined, center, 1000000000);
      const model = Polygon3D.toCSG(polys);
      return model;
    }

    const current = voidDto.position.current;
    this.biPolygon = BiPolygon.fromPositionObject(current);

    this.abyss = {model: abyssModel};
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
