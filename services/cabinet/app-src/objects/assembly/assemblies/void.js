
const Cutter = require('./cutter.js');
const Position = require('../../../position.js');
const BiPolygon = require('../../../three-d/objects/bi-polygon.js');
const Butt = require('../../joint/joints/butt.js');
const Dado = require('../../joint/joints/dado.js');
const PanelModel = require('./panel.js').Model;
const FunctionCache = require('../../../../../../public/js/utils/services/function-cache.js');
const Line3D = require('../../../three-d/objects/line.js');
const Assembly = require('../assembly.js');

FunctionCache.on('always-on', 200);

class Void extends Cutter {
  constructor(partCode, partName, config) {
    super(partCode, partName, config);
    const instance = this;
    Object.getSet(this, {includedSides: [true, true], jointSet: 1});
    this.included = (index) => this.includedSides()[index];

    const filter = exclude => s => !(s instanceof Cutter) && exclude.equalIndexOf(s) === -1;
    const updateJoints = (joint) => {
      const cabinet = this.getAssembly('c');
      if (cabinet) {
        instance.joints = [];
        const voids = Object.keys(cabinet.subassemblies).map(s => s.match(/void.*/) && cabinet.subassemblies[s]).filter(s => s);
        const voidIndex = voids.equalIndexOf(instance);
        // const excludeParts = [];
        // if (!(part instanceof Cutter)) voids.slice(0, voidIndex + 1).forEach(v => excludeParts.concatInPlace(v.getParts()));
        const subs = Object.values(cabinet.getParts());//.filter(filter(excludeParts));
        for (let index = 0; index < subs.length; index++) {
          const sub = subs[index];
          instance.addJoints(new Butt(instance.partCode(), sub.locationCode()));
        }
      }
    }

    const parentHash = this.hash;
    this.hash = () => {
      const hash = this.includedSides().toString().hash() + this.jointSet();
      return hash + parentHash();
    }

    const dadoDepth = 3 * 2.54/8;
    const panelThickness = 3*2.54/4;
    const panels = [];

    const getJoint = (mi, oi) => {
      const condition = () => instance.includedSides()[mi] === true;
      const joint = new Dado(panels[mi].locationCode(), panels[Math.mod(oi, 6)].locationCode(), condition);
      joint.parentAssemblyId(panels[mi].id());
      return joint;
    }
    const getJoints = (setIndex, mainIndex, maleIndex, femaleIndex) => {
      if (panels.length !== 6) return;
      jointSets[setIndex] =  [getJoint(mainIndex, mainIndex+2), getJoint(mainIndex, mainIndex+3),
              getJoint(mainIndex, mainIndex+4), getJoint(mainIndex, mainIndex+5),
              getJoint(mainIndex+1, mainIndex+2), getJoint(mainIndex+1, mainIndex+3),
              getJoint(mainIndex+1, mainIndex+4), getJoint(mainIndex+1, mainIndex+5),
              getJoint(maleIndex, femaleIndex), getJoint(maleIndex, femaleIndex + 1),
              getJoint(maleIndex + 1, femaleIndex), getJoint(maleIndex + 1, femaleIndex + 1)];
      return jointSets[setIndex];
    }
    const pt = panelThickness;
    const jointSets = [];
    const offsetSets = [
      {
        first: {x: pt*2, y: pt*2},
        second: {x: 2*pt, y: pt},
        third: {x: pt, y: pt},
        joints: () => jointSets[1] || getJoints(1, 4, 2, 0)
      },
      {
        first: {x: pt*2, y: pt*2},
        third: {x: 2*pt, y: pt},
        second: {x: pt, y: pt},
        joints: () => jointSets[0] || getJoints(0, 2, 4, 0)
      },
      {
        first: {x: pt, y: pt},
        second: {x: pt*2, y: pt*2},
        third: {x: pt, y: 2*pt},
        joints: () => jointSets[3] || getJoints(3, 0, 4, 2)
      },
      {
        first: {x: 2*pt, y: pt},
        second: {x: pt*2, y: pt*2},
        third: {x: pt, y: pt},
        joints: () => jointSets[4] || getJoints(4, 4, 0, 2)
      },
      {
        first: {x: pt, y: 2*pt},
        second: {x: pt, y: pt},
        third: {x: pt*2, y: pt*2},
        joints: () => jointSets[5] || getJoints(5, 2, 0, 4)
      },
      {
        first: {x: pt, y: pt},
        second: {x: pt, y: 2*pt},
        third: {x: pt*2, y: pt*2},
        joints: () => jointSets[6] || getJoints(6, 0, 2, 4)
      },
    ]

    const updateAllJoints = new FunctionCache(() => {
      const includeCond = (index) => () => instance.includedSides()[index];
      updateJoints();
      return true;
    }, this, 'always-on');

    const toBiPoly = (index) => new FunctionCache(() => {
      const startIndex = this.jointSet();
      const biPoly = this.toBiPolygon();
      let polys = biPoly.toPolygons();
      polys.swap(3,4);
      const spliceIndex = Math.mod(startIndex + index, 6);
      const offsetSet = offsetSets[this.jointSet()];
      const offset = index < 2 ? offsetSet.first : (index < 4 ? offsetSet.second : offsetSet.third);
      let pt = panelThickness;
      const center = biPoly.center();
      const centerVect = new Line3D(center.copy(), polys[index].center()).vector();

      if (!centerVect.sameDirection(polys[index].normal())) pt *= -1;

      return BiPolygon.fromPolygon(polys[index], pt, 0, offset);
    }, this, 'alwaysOn');

    let called = [];
    const toModel = (index) => new FunctionCache((incommingJoints) => {
      updateAllJoints();
      const biPoly = biPolyFuncs[index]();

      const offsetSet = offsetSets[this.jointSet()];
      const joints = offsetSet.joints().filter(j => j.femaleJointSelector() === panels[index].locationCode());
      if (!called[index]) {
        called[index] = true;
        joints.concatInPlace(panels[index].getJoints().female);
      }
      const model = biPoly.toModel();

      called[index] = false;

      return Dado.apply(model, joints);;
    }, this, 'always-on');

    const toModelFuncs = [];
    const biPolyFuncs = [];
    const buildPanel = (index) => {
      const partCode = `:p${index}`;
      const partName = this.partName() + `-panel-${index}`
      const toMod = toModelFuncs[index] ||= toModel(index);
      const toBP = biPolyFuncs[index] ||= toBiPoly(index);
      panels[index] = new PanelModel(partCode, partName, toMod, toBP);
      this.addSubAssembly(panels[index]);
      panels[index].included = () => instance.includedSides()[index] === true;
    }

    buildPanel(0);
    buildPanel(1);
    buildPanel(2);
    buildPanel(3);
    buildPanel(4);
    buildPanel(5);

    this.updateJoints = updateAllJoints;

    function abyssModel() {
      const biPoly = instance.toBiPolygon();
      const polys = biPoly.toPolygons();
      polys.swap(3,4);
      const center = biPoly.center();
      const polyVects = polys.map(p => new Line3D(center.copy(), p.center()).vector().unit());
      for (let index = 0; index < polys.length; index++) {
        const poly = polys[index].copy();
        if (instance.includedSides()[index] !== true) {
          const vector = polyVects[index];
          biPoly.extend(vector.scale(2000));
        }
      }

      // biPoly.rotate(this.position().rotation(), this.position().center());
      const model =  biPoly.toModel();
      return model;
    }

    const abyssToModel = new FunctionCache(abyssModel, this, 'alwaysOn');

    const controlableAbyss = new Cutter.Model(`:abs`, `${this.partName()}-abyss`, abyssToModel);
    this.addSubAssembly(controlableAbyss);
    this.on.parentSet(updateAllJoints);

    if (config) {
      this.jointSet(config.jointSet);
      this.includedSides(config.includedSides);
    }

    this.unCache = () => {
      toModelFuncs.forEach(f => f.clearCache());
    }

    const parentToJson = this.toJson;
    this.toJson = () => {
      const json = parentToJson();
      json.subassemblies = {}
      return json;
    }
  }
}

Void.fromJson = (json) => {
  const voId = Assembly.fromJson(json);
  voId.jointSet(json.jointSet);
  voId.includedSides(json.includedSides);
  json.constructed(() => {
    voId.updateJoints.clearCache()()
    voId.unCache();
  }, 2000);
  return voId;
}

Void.referenceConfig = (type, refPartCode, width, height) => {
  let o = {c:{},d:{},r:{},}; //offset
  let includedSides = [false, false, true, true, true, true];;
  let jointSet = 0;
  const oStr = (attr1,attr2) => o[attr1][attr2] ? o[attr1][attr2] : '';
  switch (type) {
    case 'vertical':
      switch (refPartCode) {
        case 'c_BACK':
          o.r.x = ' + 90';
          o.r.y = ' + 90';
          o.c.z = `+ d.x/2 + ${refPartCode}.d.z/2`;
          o.d.z = `${refPartCode}.d.y - 3*2.54/2`;
          includedSides = [false, false, true, true, false, true];
          jointSet = 1;
          break
        case 'c_L':
          o.r.y = ' + 90';
          o.r.x = ' + 90';
          o.d.z = `${refPartCode}.d.y - 3*2.54/4`;
          o.c.z = ' + 3*2.54/16';
          o.c.y = ``;
          o.c.x = ` + d.x/2 + 3*2.54/4`;
          includedSides = [false, false, true, true, false, true];
          jointSet = 0;
          break;
        case 'c_R':
          o.r.y = ' - 90';
          o.r.x = ' + 90';
          o.d.z = `${refPartCode}.d.y - 3*2.54/4`;
          o.c.z = ' + 3*2.54/16';
          o.c.y = ``;
          o.c.x = ` - d.x/2 - 3*2.54/4`;
          includedSides = [false, false, true, true, false, true];
          jointSet = 0;
      }
      break;
    default:
      switch (refPartCode) {
        case 'c_BACK':
          o.r.y = ' + 90';
          o.c.y = ` - ${refPartCode}.d.y/2 + d.y/2 + 3*2.54/4`;
          o.c.z = ` + d.x/2 + 3*2.54/8`;
          o.d.z = `${refPartCode}.d.x - 3*2.54/4`;
          includedSides = [false, false, true, false, false, true];
          jointSet = 2;
          break;
        case 'c_L':
          o.r.y = ' + 90';
          o.d.z = `${refPartCode}.d.x - 9*2.54/8`;
          o.c.z = ' + 3*2.54/16';
          o.c.y = ` - ${refPartCode}.d.y/2 + d.y/2 + 3*2.54/8`;
          o.c.x = ` + d.x/2 + 3*2.54/4`;
          includedSides = [false, false, true, false, false, true];
          jointSet = 0;
          break;
        case 'c_R':
          o.r.y = ' - 90';
          o.d.z = `${refPartCode}.d.x - 9*2.54/8`;
          o.c.z = ' + 3*2.54/16';
          o.c.y = ` - ${refPartCode}.d.y/2 + d.y/2 + 3*2.54/8`;
          o.c.x = ` - d.x/2 - 3*2.54/4`;
          includedSides = [false, false, true, false, false, true];
          jointSet = 0;
        }


  };

  return {
    center: {
      x: `${refPartCode}.c.x${oStr('c','x')}`,
      y: `${refPartCode}.c.y${oStr('c','y')}`,
      z: `${refPartCode}.c.z${oStr('c','z')}`,
    },
    demension: {
      x: width,
      y: height,
      z: `${oStr('d','z')}` ||  `${refPartCode}.d.y`
    },
    rotation: {
      x: `${refPartCode}.r.x${oStr('r','x')}`,
      y: `${refPartCode}.r.y${oStr('r', 'y')}`,
      z: `${refPartCode}.r.z${oStr('r', 'z')}`
    },
    includedSides, jointSet
  };
};

module.exports = Void;
