


const StringMathEvaluator = require('../../../../../public/js/utils/string-math-evaluator.js');
const Position = require('../../position.js');
const getDefaultSize = require('../../utils.js').getDefaultSize;
const Lookup = require('../../../../../public/js/utils/object/lookup.js');

const valueOfunc = (valOfunc) => (typeof valOfunc) === 'function' ? valOfunc() : valOfunc;

class Assembly extends Lookup {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr, parent) {
    super(undefined, 'id');
    const instance = this;
    let group;
    const temporaryInitialVals = {parentAssembly: parent, _TEMPORARY: true};
    const initialVals = {
      part: true,
      included: true,
      centerStr, demensionStr, rotationStr, partCode, partName,
      propertyId: undefined,
    }
    Object.getSet(this, initialVals, 'values', 'subassemblies', 'joints');
    Object.getSet(this, temporaryInitialVals);
    this.path = () => `${this.constructor.name}.${partName}`.toDot();

    if ((typeof centerStr) === 'function') this.centerStr = centerStr;
    if ((typeof demensionStr) === 'function') this.demensionStr = demensionStr;
    if ((typeof rotationStr) === 'function') this.rotationStr = rotationStr;

    const parentIncluded = this.included;

    this.included = (value) => {
        value = parentIncluded(value);
        if ((typeof value) === 'string') return  group.propertyConfig(value);
        switch (value) {
          case true: return true;
          case false: return false;
          default: return true;
        }
    }

    function getValueSmeFormatter(path) {
      const split = path.split('.');
      let attr = split[0];
      let objIdStr;
      if (split.length > 2) {
      }
      if (split.length > 1) {
        objIdStr = split[0];
        attr = split.slice(1).join('.');
      }

      let obj;
      if (objIdStr === undefined) {
        obj = instance;
      } else {
        obj = instance.getAssembly(objIdStr);
      }
      const returnVal = Assembly.resolveAttr(obj, attr);
      return returnVal;
    }
    const sme = new StringMathEvaluator({Math}, getValueSmeFormatter);
    this.eval = (eqn) => sme.eval(eqn, this);
    this.evalObject = (obj) => sme.evalObject(obj, this);

    this.getRoot = () => {
      let currAssem = this;
      while(currAssem.parentAssembly() !== undefined) currAssem = currAssem.parentAssembly();
      return currAssem;
    }

    this.group = (g) => {
      if (g) group = g;
      return group;
    }
    this.propertyConfig = (one, two) => {
      const parent = this.parentAssembly();
      if (parent instanceof Assembly) return parent.propertyConfig(one, two);
      const group = this.group();
      if (group) {
        if (one) return group.propertyConfig(one, two);
        return group.propertyConfig;
      }
    }

    let getting =  false;
    this.getAssembly = (partCode, callingAssem) => {
      if (callingAssem === this) return undefined;
      if (this.partCode() === partCode) return this;
      if (this.subassemblies[partCode]) return this.subassemblies[partCode];
      if (callingAssem !== undefined) {
        const children = Object.values(this.subassemblies);
        for (let index = 0; index < children.length; index += 1) {
          const assem = children[index].getAssembly(partCode, this);
          if (assem !== undefined) return assem;
        }
      }
      if (this.parentAssembly() !== undefined && this.parentAssembly() !== callingAssem)
        return this.parentAssembly().getAssembly(partCode, this);
      return undefined;
    }
    let position = new Position(this, sme);
    this.position = () => position;
    this.updatePosition = () => position = new Position(this, sme);
    this.joints = [];
    this.values = {};
    this.rootAssembly = () => {
      let currAssem = this;
      while (currAssem.parentAssembly() !== undefined) currAssem = currAssem.parentAssembly();
      return currAssem;
    }
    this.getJoints = (pc) => {
      const root = this.getRoot();
      if (root !== this) return root.getJoints(pc || partCode);
      pc = pc || partCode;
      const assemList = this.getSubassemblies();
      let jointList = [].concat(this.joints);
      assemList.forEach((assem) => jointList = jointList.concat(assem.joints));
      let joints = {male: [], female: []};
      jointList.forEach((joint) => {
        if (joint.malePartCode() === pc) {
          joints.male.push(joint);
        } else if (joint.femalePartCode() === pc) {
          joints.female.push(joint);
        }
      });
      return joints;
    }
    function initObj(value) {
      const obj = {};
      for (let index = 1; index < arguments.length; index += 1) {
        obj[arguments[index]] = value;
      }
      return obj;
    }
    const funcAttrs = ['length', 'width', 'thickness'];
    this.value = (code, value) => {
      if (code.match(new RegExp(funcAttrs.join('|')))) {
        this[code](value);
      } else {
        if (value !== undefined) {
          this.values[code] = value;
        } else {
          const instVal = this.values[code];
          if (instVal !== undefined && instVal !== null) {
            if ((typeof instVal) === 'number' || (typeof instVal) === 'string') {
              return sme.eval(instVal, this);
            } else {
              return instVal;
            }
          }
          if (this.parentAssembly()) return this.parentAssembly().value(code);
          else {
            try {
              const value = this.propertyConfig(this.constructor.name, code);
              if (value === undefined) throw new Error();
              return value;
            } catch (e) {
              console.error(`Failed to resolve code: ${code}`);
              throw e;
              return NaN;
            }
          }
        }
      }
    }
    this.jointOffsets = () => {
    }

    this.subassemblies = {};
    this.setSubassemblies = (assemblies) => {
      this.subassemblies = {};
      assemblies.forEach((assem) => this.subassemblies[assem.partCode()] = assem);
    };

    this.partsOf = (clazz) => {
      const parts = this.getRoot().getParts();
      if (clazz === undefined) return parts;
      return parts.filter((p) => p instanceof clazz);
    }

    // TODO: wierd dependency on inherited class.... fix!!!
    const defaultPartCode = () =>
      instance.partCode(instance.partCode() || Assembly.partCode(this));

    this.setParentAssembly = (pa) => {
      this.parentAssembly(pa);
      defaultPartCode();
    }
    this.addSubAssembly = (assembly) => {
      this.subassemblies[assembly.partCode()] = assembly;
      assembly.setParentAssembly(this);
    }

    this.objId = this.constructor.name;

    this.addJoints = function () {
      for (let i = 0; i < arguments.length; i += 1) {
        const joint = arguments[i];
        this.joints.push(joint);
        joint.parentAssemblyId(this.id());
      }
    }

    this.addSubassemblies = function () {
      for (let i = 0; i < arguments.length; i += 1) {
        this.addSubAssembly(arguments[i]);
      }
    }

    this.children = () => Object.values(this.subassemblies);

    this.getSubassemblies = () => {
      let assemblies = [];
      this.children().forEach((assem) => {
        assemblies.push(assem);
        assemblies = assemblies.concat(assem.getSubassemblies());
      });
      return assemblies;
    }
    this.getParts = () => {
      return this.getSubassemblies().filter((a) => {
        if ((typeof a.part) !== 'function') {
          console.log('party')
        }
        return a.part() && a.included()
      });
    }

    if (Assembly.idCounters[this.objId] === undefined) {
      Assembly.idCounters[this.objId] = 0;
    }

    Assembly.add(this);

    this.width = (value) => position.setDemension('x', value);
    this.length = (value) => position.setDemension('y', value);
    this.thickness = (value) => position.setDemension('z', value);
    defaultPartCode();
  }
}

Assembly.list = {};
Assembly.get = (id) => {
  const keys = Object.keys(Assembly.list);
  for (let index = 0; index < keys.length; index += 1) {
    const assembly = Assembly.list[keys[index]][id];
    if (assembly !== undefined) return assembly;
  }
  return null;
}
Assembly.add = (assembly) => {
  const name = assembly.constructor.name;
  if (Assembly.list[name] === undefined) Assembly.list[name] = {};
  Assembly.list[name][assembly.id()] = assembly;
}
Assembly.all = () => {
  const list = [];
  const keys = Object.keys(Assembly.list);
  keys.forEach((key) => list.concat(Object.values(Assembly.list[key])));
  return list;
}

const positionReg = /^(c|r|d|center|rotation|demension).(x|y|z)$/;
Assembly.resolveAttr = (assembly, attr) => {
  if (!(assembly instanceof Assembly)) return undefined;
  if (attr === 'length' || attr === 'height' || attr === 'h' || attr === 'l') {
    return assembly.length();
  } else if (attr === 'w' || attr === 'width') {
    return assembly.width();
  } else if (attr === 'depth' || attr === 'thickness' || attr === 'd' || attr === 't') {
    return assembly.thickness();
  }

  const positionMatch = attr.match(positionReg);
  if (positionMatch) {
    const func = positionMatch[1];
    const axis = positionMatch[2];
    if (func === 'r' || func === 'rotation') return assembly.position().rotation(axis);
    if (func === 'c' || func === 'center') return assembly.position().center(axis);
    if (func === 'd' || func === 'demension') return assembly.position().demension(axis);
  }
  return assembly.value(attr);
}
Assembly.fromJson = (assemblyJson) => {
  const demensionStr = assemblyJson.demensionStr;
  const centerStr = assemblyJson.centerStr;
  const rotationStr = assemblyJson.rotationStr;
  const partCode = assemblyJson.partCode;
  const partName = assemblyJson.partName;
  const clazz = Object.class.get(assemblyJson._TYPE);
  const assembly = new (clazz)(partCode, partName, centerStr, demensionStr, rotationStr);
  assembly.id(assemblyJson.id);
  assembly.values = assemblyJson.values;
  assembly.setParentAssembly(assemblyJson.parent)
  Object.values(assemblyJson.subassemblies).forEach((json) =>
    assembly.addSubAssembly(Assembly.class(json._TYPE)
                              .fromJson(json, assembly)));
  if (assemblyJson.length) assembly.length(assemblyJson.length);
  if (assemblyJson.width) assembly.width(assemblyJson.width);
  if (assemblyJson.thickness) assembly.thickness(assemblyJson.thickness);
  return assembly;
}

Assembly.classes = Object.class.object;
Assembly.new = function (id) {
  return new (Object.class.get(id))(...Array.from(arguments).slice(1));
};
Assembly.class = Object.class.get;
Assembly.classObj = Object.class.filter;

Assembly.classList = (filterFunc) => Object.values(Assembly.classObj(filterFunc));
Assembly.classIds = (filterFunc) => Object.keys(Assembly.classObj(filterFunc));
Assembly.lists = {};
Assembly.idCounters = {};

Assembly.partCode = (assembly) => {
  const cabinet = assembly.getAssembly('c');
  if (cabinet) {
    const name = assembly.constructor.name;
    cabinet.partIndex = cabinet.partIndex || 0;
    return `${assembly.constructor.abbriviation}`;
  }
}

module.exports = Assembly
