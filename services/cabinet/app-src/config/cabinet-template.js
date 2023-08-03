
const cabinetsJson = require('../../public/json/cabinets.json');
const Cabinet = require('../objects/assembly/assemblies/cabinet.js')
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const PropertyConfig = require('./property/config');

class CabinetTemplate extends Lookup {
  constructor(type) {
    super();
    const instance = this;
    const initialVals = (typeof type) === 'object' ? type : {
      type, values: [], subassemblies: [], joints: [], dividerJoint: {},
      shape: 'square',
      width: 18 * 2.54,
      height: 34 * 2.54,
      thickness: 24 * 2.54,
      fromFloor: 0,
      openings: [CabinetTemplate.defaultPartCodeOpening()],
      autoToeKick: false,
      _FORCE_FROM_JSON: true
    };
    Object.getSet(this, initialVals);
    CabinetTemplate.map[type] = this;

    function getCabinet(length, width, thickness, pc) {
      const cabinet = Cabinet.build(instance.type(), undefined, instance.toJson());
      cabinet.length(length || this.height());
      cabinet.width(width || this.width());
      cabinet.thickness(thickness || this.thickness());

      cabinet.propertyConfig(pc instanceof PropertyConfig ? pc : new PropertyConfig());
      return cabinet;
    }
    this.getCabinet = getCabinet;


    this.codeMap = () => {
      let codeMap = {};
      Object.values(this.subassemblies()).forEach((sa) => codeMap[sa.code] = sa);
      return codeMap;
    }

    this.validPartCode = (code) => this.codeMap()[code] !== undefined;
    const vpc = this.validPartCode;

    this.validOpenings = () => {
      const bms = this.openings();
      for (let index = 0; index < bms.length; index += 1) {
        const bm = bms[index];
        if (!(vpc(bm.top) && vpc(bm.bottom) && vpc(bm.right) &&
                vpc(bm.left) && vpc(bm.bottom))) {
          return false;
        }
      }
      return true;
    }
    this.validateDividerJoint = () => {
      const j = this.dividerJoint();
      return j.type === 'Butt' || (j.type === 'Dado' && j.maleOffset > 0);
    }

    const offsetReg = /(-|\+|)[xyz]/;
    this.validOffset = (offset) => offset && offset.match(offsetReg) !== null;
    const vo = this.validOffset;

    this.validateJoint = (joint, malePartCode, femalePartCode) => {
      let isValid = vpc(malePartCode) && vpc(femalePartCode);
      switch (joint.type) {
        case "Dado":
          return isValid && joint.maleOffset > 0 && vo(joint.demensionToOffset) &&
                  vo(joint.centerOffset);
        default:
          return true;
      }
    }
    this.validateJoints = () => {
      let joints = this.joints();
      for (let index = 0; index < joints.length; index += 1) {
        if (!this.validateJoint(joints[index])) return false;
      }
      return true;
    }

    this.evalEqn = (eqn, cab) => {
      cab ||= getCabinet();
      return cab.eval(eqn);
    }

    this.evalObject = (eqn, cab) => {
      cab ||= getCabinet();
      return cab.evalObject(eqn);
    }

    this.validateEquation = (eqn, cab) => {
      return !Number.isNaN(this.evalEqn(eqn, cab));
    }
    const veq = this.validateEquation;

    this.validateValues = (cab) => {
      try {
        cab ||= getCabinet();
      } catch (e) {
        return false;
      }
      const values = Object.values(this.values());
      for (let index = 0; index < values.length; index += 1) {
        if (!veq(values[index].eqn, cab)) return false;
      }
      return true;
    }

    this.validateSubassembly = (subAssem, cab) => {
      try {
        cab ||= getCabinet();
      } catch (e) {
        return false;
      }

      const c = subAssem.center;
      const d = subAssem.demensions;
      const r = subAssem.rotation;
      return vpc(subAssem.code) &&
              r.length === 3 && veq(r[0], cab) && veq(r[1], cab) && veq(r[2], cab) &&
              veq(c[0], cab) && veq(c[1], cab) && veq(c[2], cab) &&
              veq(d[0], cab) && veq(d[1], cab) && veq(d[2], cab);
    }

    this.validateSubassemblies = (cab) => {
      try {
        cab ||= getCabinet();
      } catch (e) {
        return false;
      }      const subAssems = Object.values(this.subassemblies());
      for (let index = 0; index < subAssems.length; index += 1) {
        if (!this.validateSubassembly(subAssems[index])) return false;
      }
      return true;
    }

    this.valid = () => {
      let cab;
      try {
        cab ||= getCabinet();
      } catch (e) {
        return false;
      }
      return this.validateValues(cab) && this.validOpenings() &&
              this.validateDividerJoint() && this.validateJoints() &&
              this.validateSubassemblies(cab);
    }
  }
}

CabinetTemplate.map = {};
CabinetTemplate.defaultList = () => {
  const list = [];
  const keys = Object.keys(cabinetsJson);
  // comment out to get corner-wall to be the first.
  // keys.sort();
  for (let index = 0; index < keys.length; index += 1) {
    list.push(new CabinetTemplate().fromJson(cabinetsJson[keys[index]]));
  }
  return list;
}

CabinetTemplate.typeUndefined = (type) => CabinetTemplate.map[type] === undefined;
CabinetTemplate.defaultPartCodeOpening = () => ({
    _Type: "part-code",
    top: "pt",
    bottom: "pb",
    left: "pl",
    right: "pr",
    back: "pback"
  }
);

CabinetTemplate.defaultLocationOpening = () => ({
  _Type: "location",
  zRotation: 0,
  inner: {
    top: {left: {x: 0, y: 0, z: 0}, right: {x: 0, y: 0, z: 0}},
    bottom: {right:{x: 0, y: 0, z: 0}, left: {x: 0, y: 0, z: 0}}
  },
  outer: {
    top: {left: {x: 0, y: 0, z: 0}, right: {x: 0, y: 0, z: 0}},
    bottom: {right:{x: 0, y: 0, z: 0}, left: {x: 0, y: 0, z: 0}}
  }
});

new CabinetTemplate();

module.exports = CabinetTemplate;
