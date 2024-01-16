
const JU = require('./joint');
const ApplyJoint = require('./joint');
const BiPolygon = require('../../app-src/three-d/objects/bi-polygon.js');
const Line3D = require('../../app-src/three-d/objects/line.js');
const Vertex3D = require('../../app-src/three-d/objects/vertex.js');
const OpeningToeKick = require('opening-toe-kick');
const Divider = require('divider');
const SimpleModels = require('./generic-models');
const Void = require('void');

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


const to = {}

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
    biPolygon: () => {
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
    model: () => {
      const props = this.getRoot().group().propertyConfig('DrawerBox');
      return to.DrawerBox.Simple(this.biPolygon(), this.normal(), getDrawerDepth(), props);
    }
  }
}

to.DrawerFront = {
  Solid: {
    biPolygon: () => sectionProps().coverInfo().biPolygon
  }
}

to.Door = {
  Section: {
    biPolygon: () => sectionProps().coverInfo().biPolygon
  },
  Left: {
    biPolygon: () => getBiPolygon(true)
  },
  Right: {
    biPolygon: () => getBiPolygon(false)
  }
}

to.Handle = {
  Simple: {
    model: () => handleModel(true)
  },
  Complex: {
    model: () => handleModel(false)
  }
}


to.Cutter = {
  Reference: {
    model: (dto, modelMap, joints) => {
      const biPoly = to.CutterReference.biPolygon(dto, modelMap);
      if (!isBiPoly) joints ||= modelMap.joints.female(dto);
      return JU.apply(biPoly.model(), joints);
    },
    biPolygon: function(dto, modelMap) {
      let ref = dto.reference;
      const isBiPoly = ref instanceof BiPolygon;
      let biPoly = isBiPoly ? ref : modelMap[id];
      if (biPoly === undefined) throw new Error('Invalid Reference or assemblies not ordered properly');
      biPoly.offset(fromPoint(), offset);
      let poly = (front ? biPoly.front() : biPoly.back()).reverse();
      let length = 0;
      poly.lines().forEach(l => length += l.length());
      const sameDir = biPoly.normal().sameDirection(poly.normal());
      const multiplier = sameDir ? -1 : 1;
      const distance = 10 * length;
      return BiPolygon.fromPolygon(poly, 0, multiplier * distance, {x: distance, y:distance});
    }
  },
  Poly: {
    biPolygon: () => {
      poly.lines().forEach(l => length += l.length());
      const distance = length;
      return BiPolygon.fromPolygon(poly, 0, distance, {x: distance, y:distance});
    },
    model: (joints) => {
      let length = 20;
      joints ||= this.getJoints().female;
      const biPoly = to.CutterPoly.biPolygon();
      return Joint.apply(biPoly.model(), joints);
    }
  },
  LeftCorner: {
    model: () => {
      const leftModel = instance.getAssembly('L').toModel([]).clone();
      const tkh = cabinet.value('tkh');
      leftModel.translate({x:0, y:tkh, z:0});
      return leftModel;
    }
  },
  RightCorner: {
    model: () => {
      const rightModel = instance.getAssembly('R').toModel([]).clone();
      const tkh = cabinet.value('tkh');
      rightModel.translate({x:0, y:tkh, z:0});
      return rightModel;
    }
  },
  Opening: {
    toBiPolygon: () => {
      const outer = dto.outer;
      const outerPoly = new Polygon3D(outer);
      const corner2corner = outer[0].distance(outer[2]);
      const biPoly = BiPolygon.fromPolygon(outerPoly, corner2corner/-2, 0, {x:0, y:1000});
      return biPoly;
    }
  },
  ToeKick: {
    biPolygon: (dto) => OpeningToeKick.instance(dto).Cutter
  },
  Front: {
    biPolygon: (dto) => Divider.instance(dto).Front.Cutter
  },
  Back: {
    biPolygon: (dto) => Divider.instance(dto).Back.Cutter
  },
  Abyss: {
    biPolygon: () => {
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
    biPolygon: () => {
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
    toBiPolygon: (dto) => Void.instance(dto).panel(dto.index).biPolygon()
  },
  ToeKickBacker: {
    biPolygon: (dto) => OpeningToeKick.instance(dto).Backer
  },
  Full: {
    biPolygon: (dto) => Divider.instance(dto).Full
  },
  Front: {
    biPolygon: (dto) => Divider.instance(dto).Front
  },
  Back: {
    biPolygon: (dto) => Divider.instance(dto).Back
  }
}

module.exports = to;
