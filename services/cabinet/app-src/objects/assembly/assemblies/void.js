
const Cutter = require('./cutter.js');
const Position = require('../../../position.js');
const Cut = require('../../joint/joints/cut.js');
const Joint = require('../../joint/joint.js');
const Dado = require('../../joint/joints/dado.js');
const Dependency = require('../../dependency.js');
const PanelVoidIndex = require('./panel.js').VoidIndex;
const Assembly = require('../assembly.js');

const {BiPolygon, Line3D, Vector3D, Vertex3D, Polygon3D} =
            require('../../../../../../public/js/utils/canvas/three-d/lib.js');

let voidCount = 0;
class Void extends Cutter.AutoConfigured {
  constructor(partCodeOindex, partName, config) {
    let partCode = (typeof partCodeOindex) === 'string' ? partCodeOindex :
              `void-${typeof partCodeOindex === 'number' ? partCodeOindex : ++voidCount}`;
    let index = Number.parseInt(partCode.match(/void-([0-9]{1,})/)[1]);
    super(partCode, partName, config);
    const instance = this;
    let capMale = true;
    let capJoint = new Dado(); let bodyJoint = new Dado();
    let nonVoidJoint = new Dado();
    let voidPanelJoint = new Cut();
    Object.getSet(this, {includedSides: [true, true],
      capSet: 0, maleSet: 0}, 'capMale', 'bodyJoint', 'capJoint', 'voidPanelJoint', 'nonVoidJoint');
    this.included = (index) => this.includedSides()[index];
    this.capFemale = () => !this.capMale();
    this.capMale = (trueOfalse) => Boolean.is(trueOfalse) ? (capMale = trueOfalse) : capMale;
    this.bodyJoint = (joint) => joint instanceof Joint ?
                       configureJoints((bodyJoint = joint)) : bodyJoint;
    this.capJoint = (joint) => joint instanceof Joint ?
                      configureJoints((capJoint = joint)) : capJoint;
    this.voidPanelJoint = (joint) => joint instanceof Joint ?
                       configureJoints((voidPanelJoint = joint)) : voidPanelJoint;
   this.nonVoidJoint = (joint) => joint instanceof Joint ?
                      configureJoints((nonVoidJoint = joint)) : nonVoidJoint;

    const sectorIndex = iOa => p => Vector3D.sector(p.vectors().z) === iOa;
    const charSectorIndex = iOa => p => Vector3D.sector(p.vectors().z)[0] === iOa;
    this.include = (indexOalpha, tf) => {
      if ((typeof indexOalpha) === 'string') {
        if (indexOalpha === 'BT') indexOalpha = 'Bottom'
        if (indexOalpha.length === 1) indexOalpha = panels.findIndex(charSectorIndex(indexOalpha));
        else indexOalpha = panels.findIndex(sectorIndex(indexOalpha));
      }
      const is = this.includedSides();
      if (tf===true||tf===false) is[indexOalpha] = tf;
      return is[indexOalpha];
    }

    const parentHash = this.hash;
    this.hash = () => {
      const hash = this.includedSides().toString().hash() + this.capSet() +
                        this.maleSet() + (this.capMale() === true);
      return hash + parentHash();
    }

    this.label = (i) => (i==0?'F':(i==1?'B':(i==2?'L':(i==3?'R':(i==4?'T':'BT')))));

    const dadoDepth = 3 * 2.54/8;
    const panelThickness = 3*2.54/4;

    const pt = panelThickness;

    const included = (index) => () => this.includedSides()[index];
    const vectorDirections = (index) => () => {
      if (!this.parentAssembly() || !this.parentAssembly().parentAssembly()) return [];
      const panel = panels[index];
      if (!panel.included()) return;
      const included = panels.filter(p => p.included() && p !== panel);
      return {fixed: included.map(p => p.vectors().z.unit())};
    }
    const panels = [
      new PanelVoidIndex(0, this, included(0), new Vector3D(0,0,1), new Vector3D(1,0,0)),
      new PanelVoidIndex(1, this, included(1), new Vector3D(0,0,-1), new Vector3D(-1,0,0)),
      new PanelVoidIndex(2, this, included(2), new Vector3D(-1,0,0), new Vector3D(0,0,-1)),
      new PanelVoidIndex(3, this, included(3), new Vector3D(1,0,0), new Vector3D(0,0,1)),
      new PanelVoidIndex(4, this, included(4), new Vector3D(0,-1,0), new Vector3D(-1,0,0)),
      new PanelVoidIndex(5, this, included(5), new Vector3D(0,1,0), new Vector3D(1,0,0))
    ]
    panels.forEach((p,i) => this.addSubAssembly(p) &
                    (p.jointSettings.directions.vectors = vectorDirections(i)));

    const controlableAbyss = new Cutter(`:abs`, `Abyss`);
    controlableAbyss.jointSettings.noDependencies(false);
    this.addSubAssembly(controlableAbyss);
    const allPanelsReg = new RegExp(`^${this.locationCode()}:(?!abs).*`);
    const nonVoidReg = new RegExp(/^((?!void).)*$/);
    controlableAbyss.addDependencies(new Dependency(allPanelsReg, controlableAbyss));
    instance.addDependencies(new Cut(controlableAbyss, nonVoidReg, null, 'AbyssCut'));


    const jointSets = [{cap: [0,1], maleSet:[[2,3],[4,5]]},
                      {cap: [2,3], maleSet:[[0,1],[4,5]]},
                      {cap: [4,5], maleSet:[[0,1],[2,3]]}];
    const capSet = () => jointSets[instance.capSet()].cap;
    const maleSet = () => jointSets[instance.capSet()].maleSet[instance.maleSet()];
    const isPanel = (assem) => panels.indexOf(assem) !== -1;
    const isCap = (assem) => capSet().findIndex((i) => panels[i] === assem) !== -1;
    const isntCap = (assem) => isPanel(assem) && !isCap(assem);
    const isMale = (assem) => maleSet().findIndex((i) => panels[i] === assem) !== -1;
    const isFemale = (assem) => isPanel(assem) && !isCap(assem) && !isMale(assem);
    function configureJoints(joint) {
      instance.addDependencies(instance.nonVoidJoint().sibling(isPanel, nonVoidReg, null, 'voidJoint'));
      instance.addDependencies(instance.capJoint().sibling(isCap, isntCap, instance.capMale, 'CapJointMale'));
      instance.addDependencies(instance.capJoint().sibling(isntCap, isCap, instance.capFemale, 'CapJointFemale'));
      instance.addDependencies(instance.bodyJoint().sibling(isMale, isFemale, null, 'MaleJoint'));
      return joint;
    }
    configureJoints();

    this.voidRelation = () => {
      const rankFemale = (selector) => (assem) => {
        if (!(assem instanceof PanelVoidIndex) ||
                  panels.indexOf(assem) !== -1 ||
                  !assem.match(selector)) return false;
        const voids = this.getAssemblies(/^void-[0-9]*$/);
        const assemParentIndex = voids.indexOf(assem.parentAssembly());
        if (assemParentIndex === -1) console.warn('Index Error?');
        return  this.resolve('acsendingVoidJoin', true) ? voids.indexOf(this) < assemParentIndex :
                            voids.indexOf(this) > assemParentIndex;
      }
      const femaleVoid = rankFemale(/^void-[0-9]{1,}:p[0-9]{1,}$/);
      const femalePanel = rankFemale(/^void-[0-9]{1,}:p[0-9]{1,}$/)
      instance.addDependencies(new Cut(controlableAbyss, femaleVoid, '', 'rankVoids'));
      instance.addDependencies(instance.voidPanelJoint().sibling(isPanel, femalePanel, '', 'rankPanels'));
    }
    this.voidRelation();

    if (config) {
      this.capSet(config.capSet);
      this.capMale(config.capMale);
      this.maleSet(config.maleSet);
      this.includedSides(config.includedSides);
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
  voId.capSet(json.capSet);
  voId.capMale(json.capMale);
  voId.maleSet(json.maleSet);
  voId.includedSides(json.includedSides);
  voId.bodyJoint(Object.fromJson(json.bodyJoint));
  voId.capJoint(Object.fromJson(json.capJoint));
  voId.voidPanelJoint(Object.fromJson(json.voidPanelJoint));
  voId.nonVoidJoint(Object.fromJson(json.nonVoidJoint));
  return voId;
}

Void.referenceConfig = (type, refPartCode, width, height) => {
  let o = {c:{},d:{},r:{},}; //offset
  let includedSides = [false, false, true, true, true, true];;
  let capSet = 0; let capMale = true; let maleSet = 0;
  const oStr = (attr1,attr2) => o[attr1][attr2] ? o[attr1][attr2] : '';
  switch (type) {
    case 'vertical':
      switch (refPartCode) {
        case 'c_BACK':
          o.r.x = ' + 90';
          o.c.z = ' + w/2'
          o.d.z = `${refPartCode}.d.y - 3*2.54/2`;
          includedSides = [false, false, true, true, false, true];
          capSet = 0; capMale = true; maleSet = 0;
          break
        case 'c_L':
          o.r.y = ' + 90';
          o.r.x = ' + 90';
          o.d.z = `${refPartCode}.d.y - 3*2.54/4`;
          o.c.z = ' + 3*2.54/16';
          o.c.y = ``;
          o.c.x = ` + d.x/2 + 3*2.54/8`;
          includedSides = [false, false, true, true, false, true];
          capSet = 0; capMale = true; maleSet = 0;
          break;
        case 'c_R':
          o.r.y = ' - 90';
          o.r.x = ' + 90';
          o.d.z = `${refPartCode}.d.y - 3*2.54/4`;
          o.c.z = ' + 3*2.54/16';
          o.c.y = ``;
          o.c.x = ` - d.x/2 - 3*2.54/8`;
          includedSides = [false, false, true, true, false, true];
          capSet = 0; capMale = true; maleSet = 0;
      }
      break;
    default:
      switch (refPartCode) {
        case 'c_BACK':
          o.r.y = ' + 90';
          o.c.y = ` - ${refPartCode}.d.y/2 + d.y/2 + 3*2.54/4`;
          o.c.z = ' + w/2'
          o.d.z = `${refPartCode}.d.x - 3*2.54/4`;
          includedSides = [false, false, true, false, false, true];
          capSet = 0; capMale = true; maleSet = 0;
          break;
        case 'c_L':
          o.r.y = ' + 90';
          o.d.z = `${refPartCode}.d.x - 9*2.54/8`;
          o.c.z = ' + 3*2.54/16';
          o.c.y = ` - ${refPartCode}.d.y/2 + d.y/2 + 3*2.54/8`;
          o.c.x = ` + d.x/2 + 3*2.54/4`;
          includedSides = [false, false, false, true, false, true];
          capSet = 0; capMale = true; maleSet = 0;
          break;
        case 'c_R':
          o.r.y = ' - 90';
          o.d.z = `${refPartCode}.d.x - 9*2.54/8`;
          o.c.z = ' + 3*2.54/16';
          o.c.y = ` - ${refPartCode}.d.y/2 + d.y/2 + 3*2.54/8`;
          o.c.x = ` - d.x/2 - 3*2.54/4`;
          includedSides = [false, false, false, true, false, true];
          capSet = 0; capMale = true; maleSet = 0;
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
    includedSides, capSet, capMale, maleSet
  };
};

module.exports = Void;
