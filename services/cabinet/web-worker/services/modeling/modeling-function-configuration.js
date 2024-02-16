
const BiPolygon = require('../../../app-src/three-d/objects/bi-polygon.js');
const Line3D = require('../../../app-src/three-d/objects/line.js');
const Vertex3D = require('../../../app-src/three-d/objects/vertex.js');
const Polygon3D = require('../../../app-src/three-d/objects/polygon.js');
const OpeningToeKick = require('./utils/opening-toe-kick');
const Divider = require('./utils/divider');
const SimpleModels = require('./generic-models');
const Void = require('./utils/void');
const SectionPropertiesUtil = require('./utils/section-properties');
const VoidUtil = require('./utils/void');
const HandleUtil = require('./utils/handle');
const CabinetUtil = require('./utils/cabinet');

function getDrawerDepth(depth) {
  const adjustedDepth = (depth/2.54) - 1;
  if (adjustedDepth < 3) return 0;
  return Math.floor((adjustedDepth/3) * 3) * 2.54;
}

function shrinkPoly(gap, poly, left) {
  const lines = JSON.clone(poly.lines());
  const offset = (lines[0].length() - gap) / 2;
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

function getBiPolygon(rMdto, environment, left) {
  const sectionProps = SectionPropertiesUtil.instance(rMdto, environment);
  const fullPoly = sectionProps.coverInfo().biPolygon;
  const parent = rMdto.parentAssembly();
  const front = shrinkPoly(parent.gap, fullPoly.front(), left);
  const back = shrinkPoly(parent.gap, fullPoly.back(), left);
  return new BiPolygon(front, back);
}



function defaultToModel(assemMrMdto, env) {
  const current = assemMrMdto.position.current;
  const maleJointIds = env.jointMap.male[assemMrMdto.id] || [];
  const jointsToUpdate = maleJointIds.map(jid => env.byId[jid])
                              .filter(d => d.maleOffset);
  // jointsToUpdate.forEach(j => {throw new Error('notImplemented');});
  return BiPolygon.fromPositionObject(current);
}

const defalt = {biPolygon: defaultToModel};
const complexFunctions = (cxtr, partName) => to[cxtr] !== undefined &&
        (to[cxtr][partName] || to[cxtr][cxtr]);
const simpleFunctions = (cxtr) =>
        SimpleModels[cxtr] ? {model: SimpleModels[cxtr]} : null;
const functions = (cxtr, partName) =>
        complexFunctions(cxtr, partName) || simpleFunctions(cxtr);

const idReg = /^(.*?)_(.*)$/;
const to = (rMdto) => {
  const id = rMdto.id
  const cxtr = id.replace(idReg, '$1');
  let partName = rMdto.partName;
  const funcs = functions(cxtr, partName);
  return funcs ? funcs : defalt;
}

to.usesDefault = (id, partName) => {
  const cxtr = id.replace(idReg, '$1');
  return functions(cxtr, partName) ? false : true;
}

to.SectionProperties = {
  SectionProperties: {
    biPolygon: (spRmdto, environment) =>
      SectionPropertiesUtil.instance(spRmdto, environment).biPolygon
  }
}

to.Cabinet = {
  Simple: {
    model: (mdto, environment) => {
      const childs = mdto.children.map(c => c()).filter(c => c);
      const parts = childs.filter(c => c.part || c.id.match(/^Divider/));
      const cutters = childs.filter(c => c.id.match(/^Cutter/));
      const cutter = mdto.openings[0].cutter;
      if (cutter) cutters.push(cutter());
      let csg = new CSG();
      for (let index = 0; index < parts.length; index++) {
        const id = parts[index].id;
        let model = environment.modelInfo.model[id];
        if (!(model instanceof CSG)) {
          environment.modelInfo.model[id] = model = CSG.fromPolygons(model, true);
        }
        if (model) {
          csg = csg.union(model);
        }
      }
      for (let index = 0; index < cutters.length; index++) {
        const id = cutters[index].id;
        let model = environment.modelInfo.model[id];
        if (!(model instanceof CSG)) {
          environment.modelInfo.model[id] = model = CSG.fromPolygons(model, true);
        }
        if (model) {
          csg = csg.subtract(model);
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
    model: (rMdto, environment) => {
      const sectionUtils = SectionPropertiesUtil.instance(rMdto, environment);
      const propConfig = environment.propertyConfig;
      const props = propConfig.Guides;
      const innerPoly = sectionUtils.innerPoly.copy();
      const coverInfo = sectionUtils.coverInfo().copy();
      const depth = getDrawerDepth(sectionUtils.drawerDepth());
      const normal = coverInfo.biPolygon.normal();
      const offsetVect = normal.scale(-coverInfo.backOffset);
      const sideOffset = props.dbsos;
      const topOffset = props.dbtos;
      const bottomOffset = props.dbbos;
      innerPoly.offset(sideOffset/2, sideOffset/2, topOffset, bottomOffset);
      innerPoly.translate(offsetVect);
      return SimpleModels.DrawerBox(innerPoly, normal, depth, propConfig.DrawerBox);
    }
  }
}

to.Divider = {
  Section: {
    biPolygon: (rMdto, environment) =>
        Divider.instance(rMdto, environment).biPolygon
  }
}

to.DividerSection = {
  DividerSection: {
    biPolygon: (rMdto, environment) =>
        Divider.instance(rMdto.divider(), environment).biPolygon
  }
}

to.DrawerFront = {
  Solid: {
    biPolygon: (rMdto, environment) =>
      SectionPropertiesUtil.instance(rMdto, environment).coverInfo().biPolygon
  }
}

to.Door = {
  Section: {
    biPolygon: (rMdto, environment) =>
      SectionPropertiesUtil.instance(rMdto, environment).coverInfo().biPolygon
  },
  Left: {
    biPolygon: (rMdto, environment) =>
      getBiPolygon(rMdto, environment, true)
  },
  Right: {
    biPolygon: (rMdto, environment) =>
      getBiPolygon(rMdto, environment, false)
  }
}

to.DualDoorSection = {
  DualDoorSection: {
    biPolygon: (rMdto, environment) =>
      SectionPropertiesUtil.instance(rMdto, environment).coverInfo().biPolygon
  }
}

to.DoorSection = {
  DoorSection: {
    biPolygon: (rMdto, environment) =>
      SectionPropertiesUtil.instance(rMdto, environment).coverInfo().biPolygon
  }
}

to.DrawerSection = {
  DrawerSection: {
    biPolygon: (rMdto, environment) =>
      SectionPropertiesUtil.instance(rMdto, environment).coverInfo().biPolygon
  }
}

to.FalseFrontSection = {
  FalseFrontSection: {
    biPolygon: (rMdto, environment) =>
      SectionPropertiesUtil.instance(rMdto, environment).coverInfo().biPolygon
  }
}

to.Handle = {
  Handle: {
    biPolygon: (rMdto, environment) =>
        HandleUtil(rMdto, environment, true)
  }
}

to.CutterReference = {
  Reference: {
    biPolygon: function(rMdto, environment) {
      let ref = rMdto.reference;
      const isBiPoly = ref instanceof BiPolygon;
      let biPoly = ref;
      if (!(biPoly instanceof BiPolygon)) {
        let biPolyArr = environment.modelInfo.biPolygonArray[ref.id];
        biPoly = new BiPolygon(biPolyArr[0], biPolyArr[1]);
      }
      if (biPoly === undefined) throw new Error('Invalid Reference or assemblies not ordered properly');
      biPoly.offset(rMdto.fromPoint.object(), rMdto.offset);
      let poly = (rMdto.front ? biPoly.front() : biPoly.back()).reverse();
      let length = 0;
      poly.lines().forEach(l => length += l.length());
      const cabUtil = CabinetUtil.instance(rMdto, environment);
      const polyCtoCabC = new Line3D(poly.center(), cabUtil.partCenter());
      const sameDir = polyCtoCabC.vector().sameDirection(poly.normal());
      const multiplier = sameDir ? -1 : 1;
      const distance = 10 * length;
      return BiPolygon.fromPolygon(poly, 0, multiplier * distance, {x: distance, y:distance});
    }
  }
}

to.Cutter = {
  Poly: {
    biPolygon: (rMdto, environment) => {
      let poly = rMdto.poly;
      let distance = 0;
      poly.lines().forEach(l => distance += l.length());
      return BiPolygon.fromPolygon(poly, 0, distance, {x: distance, y:distance});
    }
  },
  LeftCorner: {
    model: (rMdto, environment) => {
      const left = rMdto.find('L');
      const model = Divider.instance(left, environment).biPolygon.model();
      const tkh = environment.propertyConfig.Cabinet.tkh;
      model.translate({x:0, y:tkh, z:0});
      return model;
    }
  },
  RightCorner: {
    model: (rMdto, environment) => {
      const right = rMdto.find('R');
      const model = Divider.instance(right, environment).biPolygon.model();
      const tkh = environment.propertyConfig.Cabinet.tkh;
      model.translate({x:0, y:tkh, z:0});
      return model;
    }
  },
  Opening: {
    biPolygon: (rMdto, environment) => {
      const outerPoly = rMdto.parentAssembly().coordinates.outer.object();
      const corner2corner = outerPoly.vertex(0).distance(outerPoly.vertex(2));
      const biPoly = BiPolygon.fromPolygon(outerPoly, corner2corner/-2, 0, {x:0, y:1000});
      return biPoly;
    }
  },
  ToeKick: {
    biPolygon: (rMdto, environment) => {
      const openTk = rMdto.find('OpenTK');
      return OpeningToeKick.instance(openTk, environment).Cutter.biPolygon()
    }
  },
  Front: {
    biPolygon: (rMdto, environment) => {
      let poly = Divider.instance(rMdto, environment).Front.Cutter.polygon();
      return to.Cutter.Poly.biPolygon({poly: Divider.instance(rMdto, environment).Front.Cutter.polygon()});
    }
  },
  Back: {
    biPolygon: (rMdto, environment) => {
      let poly = Divider.instance(rMdto, environment).Back.Cutter.polygon();
      return to.Cutter.Poly.biPolygon({poly});
    }
  },
  Abyss: {
    biPolygon: (rMdto, environment) =>
      VoidUtil.instance(rMdto, environment).abyss.biPolygon()
  }
}

to.PanelVoidIndex = {
  PanelVoidIndex: {
    biPolygon: (rMdto, environment) =>
      Void.instance(rMdto, environment).panel(rMdto.index)
  },
}

to.Panel = {
  Section: {
    biPolygon: (rMdto, environment) => {
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
  ToeKickBacker: {
    biPolygon: (rMdto, environment) => {
      const openTk = rMdto.find('OpenTK');
      return OpeningToeKick.instance(openTk, environment).Backer.biPolygon();
    }
  },
  Full: {
    biPolygon: (rMdto, environment) => {
      if (rMdto.locationCode === 'c_L:full') {
        let a = 1 + 2;
      }
      return Divider.instance(rMdto, environment).Full.biPolygon()
    }
  },
  Front: {
    biPolygon: (rMdto, environment) =>
      Divider.instance(rMdto, environment).Front.biPolygon()
  },
  Back: {
    biPolygon: (rMdto, environment) => Divider.instance(rMdto, environment).Back.biPolygon()
  }
}

module.exports = to;
