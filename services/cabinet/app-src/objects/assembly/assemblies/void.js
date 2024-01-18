
const Cutter = require('./cutter.js');
const Position = require('../../../position.js');
const BiPolygon = require('../../../three-d/objects/bi-polygon.js');
const Butt = require('../../joint/joints/butt.js');
const Dado = require('../../joint/joints/dado.js');
const PanelVoidIndex = require('./panel.js').VoidIndex;
const FunctionCache = require('../../../../../../public/js/utils/services/function-cache.js');
const Line3D = require('../../../three-d/objects/line.js');
const Polygon3D = require('../../../three-d/objects/polygon.js');
const Assembly = require('../assembly.js');

FunctionCache.on('always-on', 200);

class Void extends Cutter {
  constructor(rootAssembly, partName, config) {
    let partCode = 'void';
    let index;
    try {
      partCode = rootAssembly.subassemblies.undefinedKey('void', '-', true);
      index = Number.parseInt(partCode.match(/void-([0-9]{1,})/)[1])
    } catch (e) {};
    super(partCode, partName, config);
    const instance = this;
    Object.getSet(this, {includedSides: [true, true], jointSetIndex: 1});
    this.included = (index) => this.includedSides()[index];

    this.voidRelation = (accending) => {
      if (index) {
        const regFunc = accending ? RegExp.greaterThan : RegExp.lessThan;
        const rankVoidReg = new RegExp(`^void-${regFunc(index, true)}:p[0-5]`);
        instance.addJoints(new Butt(instance.locationCode(), rankVoidReg, '', 'rankVoids'));
      }
    }

    this.voidRelation(true);
    const nonVoidReg = new RegExp(/^((?!void).)*$/);
    instance.addJoints(new Butt(instance.locationCode(), nonVoidReg));

    const parentHash = this.hash;
    this.hash = () => {
      const hash = this.includedSides().toString().hash() + setIndex;
      return hash + parentHash();
    }

    const dadoDepth = 3 * 2.54/8;
    const panelThickness = 3*2.54/4;

    const getJoint = (mi, oi) => {
      const condition = () => instance.includedSides()[mi] === true;
      const joint = new Dado(panels[mi].locationCode(), panels[Math.mod(oi, 6)].locationCode(), condition);
      return joint;
    }

    const capRegExDado = (capIndex) => ({
      male: new RegExp(`${instance.locationCode()}:p(${capIndex}|${capIndex + 1})`),
      female: new RegExp(`${instance.locationCode()}:p[^${capIndex}^${capIndex + 1}]`),
    });
    const dadoSideRegExp = (dadoedIndex, dadeedIndex) => ({
      female: new RegExp(`${instance.locationCode()}:p(${dadoedIndex}|${dadoedIndex + 1})`),
      male: new RegExp(`${instance.locationCode()}:p(${dadeedIndex}|${dadeedIndex + 1})`),
    });


    let setIndex = 0;
    const jointSets = [];
    this.jointSetIndex = (index) => {
      if (index === undefined || index > 5 || index < 0) return setIndex;
      setIndex = index;
      if (jointSets[setIndex] === undefined) {
        const capIndex = Math.floor(setIndex / 2) * 2;
        let dadoedIndex = (capIndex + 2) % 6;
        let dadeedIndex = (capIndex + 4) % 6;
        if(setIndex % 2 === 1) {
          const temp = dadoedIndex; dadoedIndex = dadeedIndex; dadeedIndex = temp;
        }
        const capJointReg = capRegExDado(capIndex);
        const dadoSideReg = dadoSideRegExp(dadoedIndex, dadeedIndex);

        jointSets[setIndex] =  [new Dado(capJointReg.male, capJointReg.female, '', 'capJoint'),
                                new Dado(dadoSideReg.male, dadoSideReg.female, '', 'dadoJoint')];
      }

      instance.addJoints(jointSets[setIndex][0]);
      instance.addJoints(jointSets[setIndex][1]);
      return setIndex;
    }
    const pt = panelThickness;

    const panels = [
      new PanelVoidIndex(0, this),
      new PanelVoidIndex(1, this),
      new PanelVoidIndex(2, this),
      new PanelVoidIndex(3, this),
      new PanelVoidIndex(4, this),
      new PanelVoidIndex(5, this)
    ]

    const controlableAbyss = new Cutter(`:abs`, `Abyss`);
    this.addSubAssembly(controlableAbyss);

    if (config) {
      this.jointSetIndex(config.jointSetIndex);
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
  voId.jointSetIndex(json.jointSetIndex);
  voId.includedSides(json.includedSides);
  return voId;
}

Void.referenceConfig = (type, refPartCode, width, height) => {
  let o = {c:{},d:{},r:{},}; //offset
  let includedSides = [false, false, true, true, true, true];;
  let jointSetIndex = 0;
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
          jointSetIndex = 1;
          break
        case 'c_L':
          o.r.y = ' + 90';
          o.r.x = ' + 90';
          o.d.z = `${refPartCode}.d.y - 3*2.54/4`;
          o.c.z = ' + 3*2.54/16';
          o.c.y = ``;
          o.c.x = ` + d.x/2 + 3*2.54/8`;
          includedSides = [false, false, true, true, false, true];
          jointSetIndex = 1;
          break;
        case 'c_R':
          o.r.y = ' - 90';
          o.r.x = ' + 90';
          o.d.z = `${refPartCode}.d.y - 3*2.54/4`;
          o.c.z = ' + 3*2.54/16';
          o.c.y = ``;
          o.c.x = ` - d.x/2 - 3*2.54/8`;
          includedSides = [false, false, true, true, false, true];
          jointSetIndex = 1;
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
          jointSetIndex = 0;
          break;
        case 'c_L':
          o.r.y = ' + 90';
          o.d.z = `${refPartCode}.d.x - 9*2.54/8`;
          o.c.z = ' + 3*2.54/16';
          o.c.y = ` - ${refPartCode}.d.y/2 + d.y/2 + 3*2.54/8`;
          o.c.x = ` + d.x/2 + 3*2.54/4`;
          includedSides = [false, false, true, false, false, true];
          jointSetIndex = 0;
          break;
        case 'c_R':
          o.r.y = ' - 90';
          o.d.z = `${refPartCode}.d.x - 9*2.54/8`;
          o.c.z = ' + 3*2.54/16';
          o.c.y = ` - ${refPartCode}.d.y/2 + d.y/2 + 3*2.54/8`;
          o.c.x = ` - d.x/2 - 3*2.54/4`;
          includedSides = [false, false, true, false, false, true];
          jointSetIndex = 0;
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
    includedSides, jointSetIndex
  };
};

module.exports = Void;
