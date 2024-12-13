
const objectsJson = require('../../public/json/cabinets/construction.json');
const Assembly = require('../objects/assembly/assembly.js')
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const PropertyConfig = require('./property/config');
const Order = require('../objects/order.js');

class AssemblyTemplate extends Lookup {
  constructor(type) {
    super();
    const instance = this;
    const initialVals = (typeof type) === 'object' ? type : {
      type, values: [], subassemblies: [], joints: [],
      shape: 'square',
      width: 18 * 2.54,
      height: 34 * 2.54,
      thickness: 24 * 2.54,
      _FORCE_FROM_JSON: true
    };
    Object.getSet(this, initialVals);
    AssemblyTemplate.map[type] = this;

    function get(length, width, thickness) {
      const group = Order.createGroup('cabinet-template');
      const assem = Assembly.build(instance.type(), group, instance.toJson());
      assem.part(false);
      return assem;
    }
    this.get = get;

    this.codeMap = () => {
      let codeMap = {};
      Object.values(this.subassemblies()).forEach((sa) => codeMap[sa.code] = sa);
      return codeMap;
    }

    this.validPartCode = (code) => this.codeMap()[code] !== undefined;
    const vpc = this.validPartCode;

    const offsetReg = /(-|\+|)[xyz]/;
    this.validOffset = (offset) => offset && offset.match(offsetReg) !== null;
    const vo = this.validOffset;

    this.validateJoint = (joint, dependsSelector, dependentSelector) => {
      let isValid = vpc(dependsSelector) && vpc(dependentSelector);
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

    this.evalEqn = (eqn, assem) => {
      assem ||= this.get();
      return assem.eval(eqn);
    }

    this.evalObject = (obj, assem) => {
      assem ||= this.get();
      return assem.evalObject(obj);
    }

    this.validateEquation = (eqn, assem) => {
      return !Number.isNaN(this.evalEqn(eqn, assem));
    }
    const veq = this.validateEquation;

    this.validateValues = (assem) => {
      try {
        assem ||= this.get();
      } catch (e) {
        return false;
      }
      const values = Object.values(this.values());
      for (let index = 0; index < values.length; index += 1) {
        if (!veq(values[index].eqn, assem)) return false;
      }
      return true;
    }

    this.validateSubassembly = (subAssem, assem) => {
      try {
        assem ||= this.get();
      } catch (e) {
        return false;
      }

      const c = subAssem.center;
      const d = subAssem.demensions;
      const r = subAssem.rotation;
      return vpc(subAssem.code) &&
              r.length === 3 && veq(r[0], assem) && veq(r[1], assem) && veq(r[2], assem) &&
              veq(c[0], assem) && veq(c[1], assem) && veq(c[2], assem) &&
              veq(d[0], assem) && veq(d[1], assem) && veq(d[2], assem);
    }

    this.validateSubassemblies = (assem) => {
      try {
        assem ||= this.get();
      } catch (e) {
        return false;
      }      const subAssems = Object.values(this.subassemblies());
      for (let index = 0; index < subAssems.length; index += 1) {
        if (!this.validateSubassembly(subAssems[index])) return false;
      }
      return true;
    }

    this.valid = () => {
      let assem;
      try {
        assem ||= this.get();
      } catch (e) {
        return false;
      }
      return this.validateValues(assem) && this.validateJoints() &&
              this.validateSubassemblies(assem);
    }
  }
}

AssemblyTemplate.cxtrTypes = () => Object.values(AssemblyTemplate.Constructors).map(cxtr => cxtr.cxtrType);
AssemblyTemplate.Constructors = {};
AssemblyTemplate.register = (clazz) => {
  AssemblyTemplate.Constructors[clazz.name] = clazz;
  clazz.cxtrType = clazz.name.replace(/(.*)Template/, '$1');
}
AssemblyTemplate.register(AssemblyTemplate);

AssemblyTemplate.new = (type, name) =>
  new (AssemblyTemplate.Constructors[type])(name);

AssemblyTemplate.map = {};
AssemblyTemplate.defaultList = () => {
  const list = [];
  const keys = Object.keys(objectsJson);
  // comment out to get corner-wall to be the first.
  // keys.sort();
  for (let index = 0; index < keys.length; index += 1) {
    const json = objectsJson[keys[index]];
    const obj = Object.fromJson(json);
    list.push(obj);
    AssemblyTemplate.register(obj.constructor);
  }
  return list;
}

AssemblyTemplate.typeUndefined = (type) => AssemblyTemplate.map[type] === undefined;

new AssemblyTemplate();

module.exports = AssemblyTemplate;
