
const Cutter = require('./cutter.js');
const Position = require('../../../position.js');
const BiPolygon = require('../../../three-d/objects/bi-polygon.js');
const Butt = require('../../joint/joints/butt.js');
const Dado = require('../../joint/joints/dado.js');
const PanelModel = require('./panel.js').Model;
const FunctionCache = require('../../../../../../public/js/utils/services/function-cache.js');
const Line3D = require('../../../three-d/objects/line.js');

FunctionCache.on('always-on', 200);

function referenceConfigs(refPartCode) {
  const configs = {};
  configs.center = [
    `${refPartCode}.c.x`,
    `${refPartCode}.c.y`,
    `${refPartCode}.c.z`
  ];
  configs.demension = [
    `${refPartCode}.d.x`,
    `${refPartCode}.d.y`,
    `${refPartCode}.d.z`
  ];
  configs.rotation = [
    `${refPartCode}.r.x`,
    `${refPartCode}.r.y`,
    `${refPartCode}.r.z`
  ];
  return configs;
}

class Void extends Cutter {
  constructor(partCode, partName, centerConfig, demensionConfig, rotationConfig) {
    super(partCode, partName, centerConfig, demensionConfig, rotationConfig);
    const instance = this;
    Object.getSet(this, {includedSides: [true, true], jointSet: 1});
    // this.included(true);
    // this.part(true);
    this.included = (index) => this.includedSides()[index];

    const filter = exclude => s => !(s instanceof Cutter) && exclude.equalIndexOf(s) === -1;
    const updateJoints = (part, joint, condition) => {
      const cabinet = this.getAssembly('c');
      if (cabinet) {
        part.joints = [];
        const voids = Object.keys(cabinet.subassemblies).map(s => s.match(/void.*/) && cabinet.subassemblies[s]).filter(s => s);
        const voidIndex = voids.equalIndexOf(instance);
        const excludeParts = [];
        if (!(part instanceof Cutter)) voids.slice(0, voidIndex + 1).forEach(v => excludeParts.concatInPlace(v.getParts()));
        const subs = Object.values(cabinet.getParts()).filter(filter(excludeParts));
        for (let index = 0; index < subs.length; index++) {
          const sub = subs[index];
          part.addJoints(new joint(part.partCode(), sub.partCode(), condition));
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
      const joint = new Dado(panels[mi].partCode(), panels[Math.mod(oi, 6)].partCode(), condition);
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
      panels.forEach((p, index) => updateJoints(p, Dado, includeCond(index)));
      updateJoints(controlableAbyss, Butt);
      return true;
    }, this, 'always-on');

    let called = [];
    const toModel = (index) => new FunctionCache(() => {
      updateAllJoints();
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
      const joints = offsetSet.joints().filter(j => j.femalePartCode() === panels[index].partCode());
      if (!called[index]) {
        console.log('toModel', index)
        joints.concatInPlace(panels[index].getJoints().female);
        called[index] = true;;
      }

      const model = BiPolygon.fromPolygon(polys[index], pt, 0, offset).toModel(joints);
      called[index] = false;
      return model;
    }, this, 'always-on');

    const buildPanel = (index) => {
      const partCode = this.partCode() + `p${index}`
      const partName = this.partName() + `-panel-${index}`
      panels[index] = new PanelModel(partCode, partName, toModel(index));
      this.addSubAssembly(panels[index]);
      panels[index].included = () => instance.includedSides()[index] === true;
    }

    buildPanel(0);
    buildPanel(1);
    buildPanel(2);
    buildPanel(3);
    buildPanel(4);
    buildPanel(5);

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
      return biPoly.toModel();
    }

    const controlableAbyss = new Cutter.Model(`${this.partCode()}abs`, `${this.partName()}-abyss`, abyssModel);
    // controlableAbyss.included(true);
    // controlableAbyss.part(true);
    this.addSubAssembly(controlableAbyss);
    this.on.parentSet(updateAllJoints);
  }
}

module.exports = Void;
