
const {BiPolygon, Line3D, Polygon3D, Vertex3D, Plane} =
    require('../../../../../../../public/js/utils/canvas/three-d/lib');
const Utils = require('utils');

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
    const toBiPoly = (panel) => {
      const biPoly = instance.biPolygon;
      const center = biPoly.center();
      const vectors = panel.vectors;
      const dems =   voidDto.position.current.demension;
      const outterFaceCenter = center.translate(vectors.z, true);
      const width = vectors.x;
      const outerPoly = Polygon3D.fromMagintudeObject(vectors, outterFaceCenter);
      const innerOffsetVector = vectors.z.unit().inverse().scale(panel.width);
      const innerPoly = outerPoly.translate(innerOffsetVector, true).reverse();
      outerPolys[panel.index] = outerPoly;
      innerPolys[panel.index] = innerPoly;
      const norm = panel.position.current.normals;

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
    const dems = current.demension;
    const norms = current.normals;
    const center = new Vertex3D(current.center);
    this.biPolygon = BiPolygon.fromVectorObject(dems.x, dems.y, dems.z,center, norms);

    this.abyss = {model: abyssModel};
  }
}

const dataPath = (assem) => 'proccessData.VoidUtil.' + assem.id;
VoidUtil.instance = (mDto, env) => {
  const voidMdto = mDto.parentAssembly();
  const rootHash = mDto.find.root().hash;
  const path = dataPath(voidMdto);
  if (env.pathValue(path) === undefined || env.pathValue(path).rootHash !== rootHash) {
    const voidUtil = new VoidUtil(voidMdto, env);
    env.pathValue(path, voidUtil);
    voidUtil.rootHash = rootHash;
  }
  return env.pathValue(path);
}


module.exports = VoidUtil;
