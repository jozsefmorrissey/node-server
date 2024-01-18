
const JU = require('./utils/joint');
const ApplyJoint = require('./utils/joint');
const BiPolygon = require('../../../app-src/three-d/objects/bi-polygon.js');
const Line3D = require('../../../app-src/three-d/objects/line.js');
const Vertex3D = require('../../../app-src/three-d/objects/vertex.js');
const OpeningToeKick = require('./utils/opening-toe-kick');
const Divider = require('./utils/divider');
const SimpleModels = require('./generic-models');
const Void = require('./utils/void');

function getDrawerDepth() {
  const depth = sectionProps().drawerDepth();
  const adjustedDepth = (depth/2.54) - 1;
  if (adjustedDepth < 3) return 0;
  return Math.floor((adjustedDepth/3) * 3) * 2.54;
}

function shrinkPoly(poly, left) {
  const lines = JSON.clone(poly.lines());
  const offset = (lines[0].length() - instance.gap()) / 2;
  if (left) {
    lines[0].length(offset, true);
    lines[1].startVertex = lines[0].endVertex;
    lines[2].length(-offset, false);
    lines[1].endVertex = lines[2].startVertex;
  } else {
    lines[0].length(-offset, false);
    lines[3].endVertex = lines[0].startVertex;
    lines[2].length(offset, true);
    lines[3].startVertex = lines[2].endVertex;
  }
  return Polygon3D.fromLines(lines);

}

function getBiPolygon(left) {
  const fullPoly = sectionProps().coverInfo().biPolygon;
  const front = shrinkPoly(fullPoly.front(), left);
  const back = shrinkPoly(fullPoly.back(), left);
  return new BiPolygon(front, back);
}

function baseCenter() {
  let center;
  const edgeOffset = (19 * 2.54) / 16;
  const toCenter = 3 * 2.54 + instance.centerToCenter() / 2;
  const front = instance.parentAssembly().front();
  const top = front.line(0);
  // TODO: Maybe... not sure why these are flipped.
  const left = front.line(-1);
  const right = front.line(1);
  const bottom = front.line(2);

  switch (instance.location()) {
    case Handle.location.TOP_RIGHT:
      center = top.endVertex;
      center.translate(top.vector().unit().scale(-edgeOffset));
      center.translate(right.vector().unit().scale(toCenter));
      break;
    case Handle.location.TOP_LEFT:
      center = top.startVertex;
      center.translate(top.vector().unit().scale(edgeOffset));
      center.translate(left.vector().unit().scale(-toCenter));
      break;
    case Handle.location.BOTTOM_RIGHT:
      center = bottom.startVertex;
      center.translate(bottom.vector().unit().scale(edgeOffset));
      center.translate(right.vector().unit().scale(-toCenter));
      break;
    case Handle.location.BOTTOM_LEFT:
      center = bottom.endVertex;
      center.translate(bottom.vector().unit().scale(-edgeOffset));
      center.translate(left.vector().unit().scale(toCenter));
      break;
    case Handle.location.TOP:
      center = top.midpoint();
      center.translate(right.vector().unit().scale(edgeOffset));
      break;
    case Handle.location.BOTTOM:
      center = bottom.midpoint();
      center.translate(right.vector().unit().scale(-edgeOffset));
      break;
    case Handle.location.RIGHT:
      center = right.midpoint();
      center.translate(top.vector().unit().scale(-edgeOffset));
      break;
    case Handle.location.LEFT:
      center = left.midpoint();
      center.translate(top.vector().unit().scale(edgeOffset));
      break;
    case Handle.location.CENTER:
      center = front.center();
      break;
    break;
    default:
      throw new Error('Invalid pull location');
  }
  return center;
};

const handleModel = (simple) => {
  const baseC = baseCenter();
  const biPolygon = this.parentAssembly().biPolygon();
  const front = biPolygon.front();
  const rotated =  instance.location().rotate;
  const line = rotated ? front.line(-1) : front.line(0);
  const normal = biPolygon.normal();
  if (simple)
    return SimpleModels.Pull.Simple(baseC, line, normal, this.projection(), this.centerToCenter());
  else
    return SimpleModels.Pull(baseC, line, normal, this.projection(), this.centerToCenter());
}


function defaultToModel(assemMrMdto) {
  const current = assemMrMdto.position.current;
  const dem = current.demension;
  const center = current.center.object();
  const vecObj = current.normals;
  const biPolyNormVect = current.biPolyNorm.object();
  return BiPolygon.fromVectorObject(dem.x, dem.y, dem.z, center, vecObj, biPolyNormVect);
}

const defalt = {biPolygon: defaultToModel};

const getRoot = (rMdto) => rMdto.linkListFind('parentAssembly', (a) => a.parentAssembly === undefined);
const find = (rMdto, partCode) => {
  const up = rMdto.linkListFind('parentAssembly', (a) => a.partCode === partCode || a.parentAssembly === undefined);
  if (up.partCode === partCode) return up;
  const func = up.linkListFind('children', (a) => (a instanceof Function ? a() : a).partCode === partCode);
  return func ? func() : null;
}

const idReg = /^(.*?)_(.*)$/;
const to = (rMdto, onlyCustomBuilders) => {
  const id = rMdto.id
  const cxtr = id.replace(idReg, '$1');
  let partName = rMdto.partName;
  return to[cxtr] && to[cxtr][partName] || (!onlyCustomBuilders && defalt);
}

to.Cabinet = {
  Simple: {
    model: (modelMap) => {
      const subs = Object.values(this.subassemblies);
      const toeKick = getToeKick();
      if (toeKick) {
        subs.concatInPlace(toeKick.getParts());
      }
      let csg = new CSG();
      for (let index = 0; index < subs.length; index++) {
        if (ToModel(subs[index]) instanceof Function) {
          csg = csg.union(modelMap[subs[index].id]);
        }
      }
      return csg;
    }
  }
}

to.DrawerBox = {
  Simple: {
    model: SimpleModels.DrawerBox
  },
  Section: {
    normal: () => sectionProps().normal(),
    biPolygon: (rMdto, modelMap) => {
      const propConfig = sectionProps().getRoot().group().propertyConfig;
      const props = propConfig('Guides');
      const innerPoly = new Polygon3D(sectionProps().coordinates().inner);
      const coverInfo = sectionProps().coverInfo();
      const biPoly = front.biPolygon();
      const depth = getDrawerDepth(sectionProps().innerDepth);
      const offsetVect = biPoly.normal().scale(-coverInfo.backOffset);
      const sideOffset = props.dbsos.value();
      const topOffset = props.dbtos.value();
      const bottomOffset = props.dbbos.value();
      innerPoly.offset(sideOffset/2, sideOffset/2, topOffset, bottomOffset);
      return innerPoly.translate(offsetVect);
    },
    model: (rMdto, modelMap) => {
      const props = this.getRoot().group().propertyConfig('DrawerBox');
      return to.DrawerBox.Simple(this.biPolygon(), this.normal(), getDrawerDepth(), props);
    }
  }
}

to.DrawerFront = {
  Solid: {
    biPolygon: (rMdto, modelMap) => sectionProps().coverInfo().biPolygon
  }
}

to.Door = {
  Section: {
    biPolygon: (rMdto, modelMap) => sectionProps().coverInfo().biPolygon
  },
  Left: {
    biPolygon: (rMdto, modelMap) => getBiPolygon(true)
  },
  Right: {
    biPolygon: (rMdto, modelMap) => getBiPolygon(false)
  }
}

to.Handle = {
  Simple: {
    model: (rMdto, modelMap) => handleModel(true)
  },
  Complex: {
    model: (rMdto, modelMap) => handleModel(false)
  }
}

to.CutterReference = {
  Reference: {
    biPolygon: function(rMdto, modelMap) {
      let ref = rMdto.reference;
      const isBiPoly = ref instanceof BiPolygon;
      let biPoly = ref;
      if (!(biPoly instanceof BiPolygon)) {
        let biPolyArr = modelMap.modelInfo[ref.id].biPolygonArray;
        biPoly = new BiPolygon(biPolyArr[0], biPolyArr[1]);
      }
      if (biPoly === undefined) throw new Error('Invalid Reference or assemblies not ordered properly');
      biPoly.offset(rMdto.fromPoint.object(), rMdto.offset);
      let poly = (rMdto.front ? biPoly.front() : biPoly.back()).reverse();
      let length = 0;
      poly.lines().forEach(l => length += l.length());
      const sameDir = !biPoly.normal().sameDirection(poly.normal());
      const multiplier = sameDir ? -1 : 1;
      const distance = 10 * length;
      return BiPolygon.fromPolygon(poly, 0, multiplier * distance, {x: distance, y:distance});
    }
  }
}

to.Cutter = {
  Poly: {
    biPolygon: (rMdto, modelInfo) => {
      let poly = rMdto.poly;
      let distance = 0;
      poly.lines().forEach(l => distance += l.length());
      return BiPolygon.fromPolygon(poly, 0, distance, {x: distance, y:distance});
    }
  },
  LeftCorner: {
    model: (rMdto, modelInfo) => {
      const root = getRoot(rMdto);
      const left = find(rMdto, 'L');
      const model = to(left).model();
      const tkh = modelInfo.propertyConfig.Cabinet.tkh;
      model.translate({x:0, y:tkh, z:0});
      return model;
    }
  },
  RightCorner: {
    model: (rMdto, modelInfo) => {
      const root = getRoot(rMdto);
      const right = find(rMdto, 'R');
      const model = to(right).model();
      const tkh = modelInfo.propertyConfig.Cabinet.tkh;
      model.translate({x:0, y:tkh, z:0});
      return model;
    }
  },
  Opening: {
    toBiPolygon: (rMdto, modelInfo) => {
      const outer = rMdto.outer;
      const outerPoly = new Polygon3D(outer);
      const corner2corner = outer[0].distance(outer[2]);
      const biPoly = BiPolygon.fromPolygon(outerPoly, corner2corner/-2, 0, {x:0, y:1000});
      return biPoly;
    }
  },
  ToeKick: {
    biPolygon: (rMdto, modelInfo) =>
        OpeningToeKick.instance(rMdto, modelInfo).Cutter.biPolygon()
  },
  Front: {
    biPolygon: (rMdto, modelInfo) => {
      let poly = Divider.instance(rMdto, modelInfo).Front.Cutter.polygon();
      return to.Cutter.Poly.biPolygon({poly});
    }
  },
  Back: {
    biPolygon: (rMdto, modelInfo) => {
      let poly = Divider.instance(rMdto, modelInfo).Back.Cutter.polygon();
      return to.Cutter.Poly.biPolygon({poly});
    }
  },
  Abyss: {
    biPolygon: (rMdto, modelMap) => {
      const biPoly = instance.toBiPolygon();
      const polys = biPoly.toPolygons();
      polys.swap(3,4);
      const center = biPoly.center();
      const joints = controlableAbyss.getJoints();
      const polyVects = polys.map(p => new Line3D(center.copy(), p.center()).vector().unit());
      for (let index = 0; index < polys.length; index++) {
        const poly = polys[index].copy();
        if (instance.includedSides()[index] !== true) {
          const vector = polyVects[index];
          biPoly.extend(vector.scale(2000));
        }
      }
      return biPoly;
    }
  }
}

to.Panel = {
  Section: {
    biPolygon: (rMdto, modelMap) => {
      const sp = sectionProps();
      const ip = sp.innerPoly();
      const tt = sp.top().thickness();
      const bt = sp.bottom().thickness();
      const lt = sp.left().thickness();
      const rt = sp.right().thickness();

      const sizeOffset = {x: lt + rt , y: tt + bt};
      const poly = BiPolygon.fromPolygon(ip, 0, 3*2.54/4, sizeOffset);

      const rightOffset = ip.lines()[0].vector().unit().scale(rt - lt);
      const downOffset = ip.lines()[0].vector().unit().scale(bt - tt);
      const centerOffset = rightOffset.add(downOffset);
      poly.translate(centerOffset);

      return poly;
    }
  },
  Void: {
    toBiPolygon: (rMdto, modelInfo) => Void.instance(rMdto, modelInfo).panel(rMdto.index).biPolygon()
  },
  ToeKickBacker: {
    biPolygon: (rMdto, modelInfo) => OpeningToeKick.instance(rMdto, modelInfo).Backer
  },
  Full: {
    biPolygon: (rMdto, modelInfo) =>
      Divider.instance(rMdto, modelInfo).Full.biPolygon()
  },
  Front: {
    biPolygon: (rMdto, modelInfo) =>
      Divider.instance(rMdto, modelInfo).Front.biPolygon()
  },
  Back: {
    biPolygon: (rMdto, modelInfo) => Divider.instance(rMdto, modelInfo).Back.biPolygon()
  }
}

module.exports = to;
