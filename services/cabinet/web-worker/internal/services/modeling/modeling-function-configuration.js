

const {Line3D, Vector3D, BiPolygon, Vertex3D, Polygon3D} =
      require('../../../../../../public/js/utils/canvas/three-d/lib');

const OpeningToeKick = require('./utils/opening-toe-kick');
const Divider = require('./utils/divider');
const SimpleModels = require('./generic-models');
const SectionPropertiesUtil = require('./utils/section-properties');
const VoidUtil = require('./utils/void');
const HandleUtil = require('./utils/handle');
const CabinetUtil = require('./utils/cabinet');
const DrawerBoxUtil = require('./utils/drawer-box');
const DoorUtil = require('./utils/door');
const CutterUtil = require('./utils/cutter');
const Utils = require('./utils/utils');


const defalt = {biPolygon: Utils.toBiPolygon};
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
    biPolygon: (spRmdto, env) =>
      SectionPropertiesUtil.instance(spRmdto, env).biPolygon
  }
}

to.Assembly = {
  Assembly: {
    model: (mdto, env) => new CSG(),
    joined: (mdto, env) => {
      const childs = mdto.children.map(c => c()).filter(c => c instanceof Object);
      const parts = childs.filter(c => c.part || c.id.match(/^Divider/));
      let csg = new CSG();
      for (let index = 0; index < parts.length; index++) {
        const id = parts[index].id;
        let model = env.modelInfo.model[id];
        if (model) {
          if (!(model instanceof CSG)) {
            env.modelInfo.model[id] = model = CSG.fromPolygons(model, true);
          }
          csg = csg.union(model);
        }
      }
      return csg;
    }
  }
}

to.Cabinet = {
  Simple: {
    model: (mdto, env) => {
      const childs = mdto.children.map(c => c()).filter(c => c instanceof Object);
      const parts = childs.filter(c => c.part || (c.id.match(/^Divider/) && (c.part = true)));
      let csg = new CSG();
      return csg;
    },
    joined: (mdto, env) => {
      const childs = mdto.children.map(c => c()).filter(c => c instanceof Object);
      const parts = childs.filter(c => c.part || c.id.match(/^Divider/));
      let csg = new CSG();
      for (let index = 0; index < parts.length; index++) {
        const id = parts[index].id;
        let model = env.getModel(id, 'joined');
        if (model) {
          if (!(model instanceof CSG)) {
            model = CSG.fromPolygons(model, true);
          }
          csg = csg.union(model);
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
    model: DrawerBoxUtil.drawerBox
  }
}

to.Guide = {
  Guide: {
    model: DrawerBoxUtil.guide
  }
}

to.Divider = {
  Section: {
    biPolygon: (rMdto, env) =>
        Divider.instance(rMdto, env).biPolygon
  }
}

to.DrawerFront = {
  Solid: {
    biPolygon: SectionPropertiesUtil.stdCoverObject
  }
}

to.Door = {
  Section: {
    biPolygon: SectionPropertiesUtil.stdCoverObject
  },
  Left: {biPolygon: DoorUtil.Left},
  Right: {biPolygon: DoorUtil.Right}
}

to.DualDoorSection = {
  DualDoorSection: {
    biPolygon: SectionPropertiesUtil.stdCoverObject
  }
}

to.DoorSection = {
  DoorSection: {
    biPolygon: SectionPropertiesUtil.stdCoverObject
  }
}

to.DrawerSection = {
  DrawerSection: {
    biPolygon: SectionPropertiesUtil.stdCoverObject
  }
}

to.FalseFrontSection = {
  FalseFrontSection: {
    biPolygon: SectionPropertiesUtil.stdCoverObject
  }
}

to.Handle = {
  Handle: {
    biPolygon: (rMdto, env) =>
        HandleUtil(rMdto, env, true)
  }
}

to.CutterReference = {
  Reference: {
    biPolygon: function(rMdto, env) {
      let ref = rMdto.reference;
      const isBiPoly = ref instanceof BiPolygon;
      let biPoly = ref;
      if (biPoly instanceof BiPolygon)
        console.log('do i use this');
      if (env.modelInfo.biPolygonArray[ref.id]) {
        if (!(biPoly instanceof BiPolygon)) {
          let biPolyArr = env.modelInfo.biPolygonArray[ref.id];
          biPoly = new BiPolygon(biPolyArr[0], biPolyArr[1]);
        }
        if (biPoly === undefined) throw new Error('Invalid Reference or assemblies not ordered properly');
        biPoly.offset(rMdto.fromPoint.object(), rMdto.offset);
        let poly = (rMdto.front ? biPoly.front() : biPoly.back()).reverse();
        let length = 0;
        poly.lines().forEach(l => length += l.length());
        const cabUtil = CabinetUtil.instance(rMdto, env);
        const polyCtoCabC = new Line3D(poly.center(), cabUtil.partCenter());
        const sameDir = polyCtoCabC.vector().sameDirection(poly.normal());
        const multiplier = sameDir ? -1 : 1;
        const distance = 10 * length;
        return BiPolygon.fromPolygon(poly, 0, multiplier * distance, {x: distance, y:distance});
      }
      return null;
    }
  }
}

to.CutterRegExp = {
  RegExp: {
    model: (rMdto, env) => CutterUtil.RegExpModel(rMdto, env, to)
  }
}

to.Cutter = {
  Poly: {
    biPolygon: (rMdto, env) => {
      let poly = rMdto.poly;
      let distance = 0;
      poly.lines().forEach(l => distance += l.length());
      return BiPolygon.fromPolygon(poly, 0, distance, {x: distance, y:distance});
    }
  },
  LeftCorner: {
    model: (rMdto, env) => {
      const left = rMdto.find('L');
      const model = Divider.instance(left, env).biPolygon.model();
      const tkh = Utils.property('tkh', rMdto, env);;
      model.translate({x:0, y:tkh, z:0});
      return model;
    }
  },
  RightCorner: {
    model: (rMdto, env) => {
      const right = rMdto.find('R');
      const model = Divider.instance(right, env).biPolygon.model();
      const tkh = Utils.property('tkh', rMdto, env);;
      model.translate({x:0, y:tkh, z:0});
      return model;
    }
  },
  Opening: {
    biPolygon: (rMdto, env) => {
      const outerPoly = rMdto.parentAssembly().coordinates.outer.object();
      const big = 10000000000;
      const biPoly = BiPolygon.fromPolygon(outerPoly, -100, 0, {x:100, y:100});
      return biPoly;
    }
  },
  ToeKick: {
    biPolygon: (rMdto, env) => {
      const openTk = rMdto.find('OpenTK');
      return OpeningToeKick.instance(openTk, env).Cutter.biPolygon()
    }
  },
  ToeKickPerp: {
    biPolygon: (rMdto, env) => {
      const tkh = Utils.property('tkh',rMdto, env);
      const tkd = Utils.property('tkd',rMdto, env);

      const rightOleft = rMdto.partCode.substr(-1).toUpperCase();
      const openTk = rMdto.find('OpenTK');
      const opNorm = openTk.opening().normals.z;
      const target = env.find(rightOleft, 'partCode')[0];
      const norms = Utils.normals(target);
      const center = new Vertex3D(target.position.current.center);
      const dems = target.position.current.demension;
      const normX = !norms.x.sameDirection(opNorm) ? norms.x : norms.x.inverse();
      const normY = norms.y.positive() ? norms.y.inverse() : norms.y;
      const bottomOuterVect = normX.scale(dems.x/2).add(normY.scale(dems.y/2));
      const bottomOuter = center.translate(bottomOuterVect, true);
      const bottomInner = bottomOuter.translate(normX.inverse().scale(tkd), true);
      const topInner = bottomInner.translate(normY.inverse().scale(tkh), true);
      const topOuter = topInner.translate(normX.scale(tkd), true);

      const centerPoly = new Polygon3D([bottomOuter, bottomInner, topInner, topOuter]);
      const biPoly = BiPolygon.fromPolygon(centerPoly, dems.z*2, -dems.z*2);

      return biPoly;
    }
  },
  Front: {
    biPolygon: (rMdto, env) => {
      let poly = Divider.instance(rMdto, env).Front.Cutter();
      return to.Cutter.Poly.biPolygon({poly: Divider.instance(rMdto, env).Front.Cutter()});
    }
  },
  FrameRail: {
    biPolygon: (rMdto, env) => {
      let poly = Divider.instance(rMdto, env).Frame.Cutter();
      return to.Cutter.Poly.biPolygon({poly: Divider.instance(rMdto, env).Frame.Cutter()});
    }
  },
  Back: {
    biPolygon: (rMdto, env) => {
      let poly = Divider.instance(rMdto, env).Back.Cutter();
      return to.Cutter.Poly.biPolygon({poly});
    }
  },
  Abyss: {
    model: (rMdto, env) =>
      VoidUtil.instance(rMdto, env).abyss.model()
  }
}

to.PanelVoidIndex = {
  PanelVoidIndex: {
    biPolygon: (rMdto, env) =>
      VoidUtil.instance(rMdto, env).panel(rMdto, env)
  },
}

to.Frame = {
  Frame: {
    biPolygon: (rMdto, env) =>
      Divider.instance(rMdto, env).Frame(rMdto)
  }
}

to.Panel = {
  Section: {
    biPolygon: (rMdto, env) => {
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
    biPolygon: (rMdto, env) => {
      const openTk = rMdto.find('OpenTK');
      return OpeningToeKick.instance(openTk, env).Backer.biPolygon();
    }
  },
  Full: {
    biPolygon: (rMdto, env) => {
      return Divider.instance(rMdto, env).Full(rMdto)
    }
  },
  Front: {
    biPolygon: (rMdto, env) =>
      Divider.instance(rMdto, env).Full(rMdto),
    cut: (rMdto, env) =>
      Divider.instance(rMdto, env).Front(rMdto, env)
  },
  Back: {
    biPolygon: (rMdto, env) =>
      Divider.instance(rMdto, env).Full(rMdto),
    cut: (rMdto, env) =>
      Divider.instance(rMdto, env).Back(rMdto, env)
  }
},

to.Shelve = {
  Shelve: {
    biPolygon: (rMdto, env) => {
      const parent = rMdto.parentAssembly();
      const sectionUtils = SectionPropertiesUtil.instance(parent, env);
      const divider = parent.bottom();
      const biPoly = Divider.instance(divider, env).Full().copy();
      const shelveCount = parent.shelves.length;
      const index = Number.parseInt(rMdto.partCode.replace(/.*?([0-9]{1,})$/, '$1'));
      const dividerNorms = divider.position.current.normals;
      rMdto.position.current.normals = dividerNorms;
      biPoly.translate(new Vector3D(0,sectionUtils.inner.len*index/(shelveCount+1),0));
      return biPoly;
    },
    extended: (rMdto, env) => {
      const parent = rMdto.parentAssembly();
      const sectionUtils = SectionPropertiesUtil.instance(parent, env);
      const csg = env.getModel(rMdto, 'extended');
      if (csg.polygons.length === 0) return csg;
      const cutter = BiPolygon.fromPolygon(sectionUtils.outerPoly, 0, 13*2.54/16).model();
      return csg.subtract(cutter);
    }
  }
}


module.exports = to;
