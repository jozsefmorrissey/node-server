


const StringMathEvaluator = require('../../../../../public/js/utils/string-math-evaluator.js');
const Position = require('../../position.js');
const getDefaultSize = require('../../utils.js').getDefaultSize;
const Vertex3D = require('../../three-d/objects/vertex.js');
const Line3D = require('../../three-d/objects/line.js');
const KeyValue = require('../../../../../public/js/utils/object/key-value.js');
const FunctionCache = require('../../../../../public/js/utils/services/function-cache.js');
const Joint = require('../joint/joint');
const CustomEvent = require('../../../../../public/js/utils/custom-event.js');

FunctionCache.on('hash', 250);
const valueOfunc = (valOfunc) => (typeof valOfunc) === 'function' ? valOfunc() : valOfunc;

function maxHeight(a, b, c) {
  const minSide = a > b ? b : a;
  return Math.sqrt(c*c - minSide*minSide);
}

class Assembly extends KeyValue {
  constructor(partCode, partName, config, parent) {
    // TODO should pass this in as and object
    super({childrenAttribute: 'subassemblies', parentAttribute: 'parentAssembly', object: true});

    const pcIsFunc = partCode instanceof Function;
    function pCode(doNotAppendParent) {
      const pc = pcIsFunc ? partCode(doNotAppendParent) : partCode || 'unk';
      if (doNotAppendParent === true) return pc;
      const parent = instance.parentAssembly();
      const subPartCode = pc.match(/:.{1,}$/);
      if (parent && subPartCode) return `${parent.partCode()}${pc}`;
      return pc;
    }

    function lCode() {
      const pc = pcIsFunc ? partCode() : partCode || 'unk';
      const parent = instance.parentAssembly();
      const subPartCode = pc.match(/:.{1,}$/);
      const connector = subPartCode ? '' : '_'
      if (parent) return `${parent.locationCode()}${connector}${pc}`;
      return pc;
    }

    const instance = this;
    let group;
    const temporaryInitialVals = {parentAssembly: parent, _TEMPORARY: true};
    const initialVals = {
      part: true,
      included: true,
      includeJoints: true,
      config, partCode: pCode, partName,
      locationCode: lCode,
      propertyId: undefined,
    }

    const subAssems = this.subassemblies;
    if (Array.isArray(subAssems)) {
      console.log('wtff');
    }
    Object.getSet(this, initialVals, 'subassemblies', 'joints', 'normals');
    Object.defineProperty(this, "subassemblies", {
      writable: false,
      enumerable: false,
      configurable: false,
      value: subAssems
    });
    Object.getSet(this, temporaryInitialVals);
    this.path = () => `${this.constructor.name}.${partName}`.toDot();

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

    const parentIncludeJoints = this.includeJoints;
    this.includeJoints = (trueOfalse) => parentIncludeJoints(trueOfalse) && this.included();

    function getValueSmeFormatter(path) {
      const split = path.split('.');
      let attr = split[0];
      let objIdStr;

      const value = Assembly.resolveAttr(instance, path);
      if (Number.isFinite(value)) return value;

      if (split.length > 1) {
        objIdStr = split[0];
        attr = split.slice(1).join('.');
      }

      let obj;
      if (objIdStr !== undefined) {
        obj = instance.getAssembly(objIdStr);
      }

      if (obj) {
        const returnVal = Assembly.resolveAttr(obj, attr);
        return returnVal;
      }
    }

    const sme = new StringMathEvaluator({Math, maxHeight}, getValueSmeFormatter);
    this.sme = () => sme;

    // KeyValue setup
    const funcReg = /length|width|thickness/;
    this.value.addCustomFunction((key, value) => key.match(funcReg) ? this[code](value) : undefined)
    this.value.evaluators.string = (value) => {
      const evaled = sme.eval(value, this);
      return Number.isNaN(evaled) ? value : evaled;
    }
    this.value.defaultFunction = (key) => this.propertyConfig(this.constructor.name, key);

    this.eval = (eqn) => sme.eval(eqn, this);
    this.evalObject = (obj) => sme.evalObject(obj, this);

    const changeEvent = new CustomEvent('change', true);
    this.on.change = changeEvent.on;
    this.trigger.change = changeEvent.trigger;
    let lastHash;
    function hash() {
      const valueObj = instance.value.values;
      const keys = Object.keys(valueObj).sort();
      let hash = 0;
      if (instance.parentAssembly() === undefined) hash += `${instance.length()}x${instance.width()}x${instance.thickness()}`.hash();
      hash += Object.hash(this.config());
      hash += keyValHash();
      const subAssems = Object.values(instance.subassemblies).sortByAttr('id');
      for (let index = 0; index < subAssems.length; index++) {
        hash += subAssems[index].hash(true);
      }
      if (hash !== lastHash) {
        changeEvent.trigger(instance);
      }
      lastHash = hash;
      return hash;
    }

    const keyValHash = this.hash;
    this.hash = new FunctionCache(hash, this, 'hash');

    this.group = (g) => {
      if (g) group = g;
      return group;
    }
    this.layout = () => this.group().room().layout();
    this.propertyConfig = (one, two, three) => {
      const parent = this.parentAssembly();
      if (parent instanceof Assembly) return parent.propertyConfig(one, two, tree);
      const group = this.group();
      const groupVal = group.resolve(one, two, three);
      if (groupVal !== undefined) return groupVal;
      return group.propertyConfig;
    }

    let ranCount = 0;
    function allAssemblies() {
      const root = instance.rootAssembly();
      if (root !== instance) return root.allAssemblies();
      const list = [root];
      let index = 0;
      while(list[index]) {
        const children = list[index].children();
        for (let i = 0; i < children.length; i++) {
          list.push(children[i]);
        }
        index++;
      }
      return list;
    }
    this.allAssemblies = new FunctionCache(allAssemblies, this, 'alwaysOn');

    const constructUserFriendlyId = (idMap) => (part) => {
      const pc = part.partCode(true);
      if (!pc.startsWith(':')) return pc;
      const parent = part.parentAssembly();
      if (parent) {
        const parentId = idMap[parent.id()];
        if (parentId) return `${parentId}${pc}`;
        else return 'unidentified';
      }
      return pc;
    }

    function buildUserFriendlyIdMap() {
      let unidentified = this.allAssemblies();
      const idMap = {};
      do {
        const split = unidentified.filterSplit(constructUserFriendlyId(idMap));
        const keys = Object.keys(split);
        for(let index = 0; index < keys.length; index++) {
          const key = keys[index];
          const set = split[key];
          if (set.length === 1) idMap[set[0].id()] = key;
          else {
            for (let si = 0; si < set.length; si++) {
              idMap[set[si].id()] = `${key}${si+1}`;
            }
          }
        }
        unidentified = split.unidentified;
      } while (unidentified && unidentified.length > 0);
      return idMap;
    }
    this.userFriendlyIdMap = new FunctionCache(buildUserFriendlyIdMap, this, 'alwaysOn');
    this.userFriendlyId = (id) => {
      id ||= this.id();
      if (this.parentAssembly() !== undefined) return this.getRoot().userFriendlyIdMap()[id];
      return this.userFriendlyIdMap()[id];
    }

    function nearestAssembly(partCode) {
      const searchReg = Assembly.partCodeReg(partCode);
      const searchList = [instance];
      let searchIndex = 0;
      const searched = {};
      const childrenAdded = {};
      const matches = [];
      while (searchIndex < searchList.length) {
        const part = searchList[searchIndex];
        if (searched[part.id()] === undefined) {
          if (part.locationCode().match(searchReg)) {
            return part;
          }
          const parent = part.parentAssembly();
          if (parent) {
            if (searchIndex === -1) searchList.concatInPlace(parent.children());
            searchList.push(parent);
          }
          searched[part.id()] = true;
        }
        if (!childrenAdded[part.id()]) {
          searchList.concatInPlace(part.children());
          childrenAdded[part.id()] = true;
        }
        searchIndex++;
      }
    }

    function getAssembly(partCode, all) {
      if (all !== true) return nearestAssembly(partCode);
      else {
        const root = instance.rootAssembly();
        if (root !== instance) return root.getAssembly(partCode, all);
        const searchReg = Assembly.partCodeReg(partCode);
        const assems = this.allAssemblies();
        const list = [];
        for (let index = 0; index < assems.length; index++) {
          const assem = assems[index];
          if (assem.locationCode().match(searchReg)) list.push(assem);
        }
        return list;
      }
    }

    this.getAssembly = new FunctionCache(getAssembly, this, 'alwaysOn');
    let position = new Position(this, sme, config);
    this.config = position.configuration;

    this.position = () => position;
    this.toModel = this.position().toModel;
    this.toBiPolygon = this.position().toBiPolygon;
    this.updatePosition = () => position = new Position(this, sme);
    this.joints = [];
    this.values = {};
    this.rootAssembly = () => {
      let currAssem = this;
      while (currAssem.parentAssembly() !== undefined) currAssem = currAssem.parentAssembly();
      return currAssem;
    }

    let normObj;
    this.normals = (array, normalObj) => {
      if (normalObj instanceof Object) {
        if (!Array.isArray(normalObj)) normObj = normalObj;
        else normObj = {x: normalObj[0], y: normalObj[1], z: normalObj[2]};
      }
      return array ? (normObj ? [normObj.x, normObj.y, normObj.z] : undefined) : normObj;
    }

    // decendents = (assem) => {
    //   const children = [];
    //   const subAssems = Object.values(assem.subassemblies);
    //   for (let index = 0; index < subAssems.length; index++) {
    //     const child = subAssems[index];
    //     children.push(child);
    //     children.concatInPlace(decendents(assem));
    //   }
    //   return children;
    // }
    //
    // relatedAssemblies = (assem) => {
    //   const related= [assem];
    //   let curr = assem;
    //   while ((curr = curr.parentAssembly())) related.push(curr);
    //   const root = related[related.length - 1];
    //   related.concatInPlace(Object.values(root.subassemblies));
    //   related.concatInPlace(decendents(assem));
    //   return related;
    // }

    this.getJoints = new FunctionCache((assem) => {
      assem ||= this;
      const root = this.getRoot();
      if (root !== this) return root.getJoints(assem);

      const assemList = this.allAssemblies();
      let allJoints = [].concat(this.joints);
      if (assem) allJoints.concatInPlace(assem.joints);
      assemList.forEach((assem) => allJoints.concatInPlace(assem.joints));
      let joints = {male: [], female: []};
      const addJoint = (joint) => {
        if (joint instanceof Joint.References) {
          joint.list().forEach(addJoint);
        } else if (joint.isMale(assem)) {
          joints.male.push(joint);
        } else if (joint.isFemale(assem)) {
          joints.female.push(joint);
        }
      };
      allJoints.forEach(addJoint);
      jointList = joints.male.concat(joints.female);
      return joints;
    }, this, 'always-on');

    this.getAllJoints = new FunctionCache((assem) => {
      assem ||= this;
      const root = this.getRoot();
      if (root !== this) return root.getJoints(assem);

      const assemList = this.allAssemblies();
      let allJoints = [].concat(this.joints);
      // if (assem) allJoints.concatInPlace(assem.joints);
      assemList.forEach((assem) => allJoints.concatInPlace(assem.joints));
      return allJoints;
    }, this, 'always-on');

    let jointList;
    this.getJointList = () => {
      return jointList || [];
    }

    this.setSubassemblies = (assemblies) => {
      this.subassemblies = {};
      assemblies.forEach((assem) => this.subassemblies[assem.partCode()] = assem);
    };

    this.partsOf = (clazz) => {
      const parts = this.getRoot().getParts();
      if (clazz === undefined) return parts;
      return parts.filter((p) => p instanceof clazz);
    }

    let parentAssembly;
    this.parentAssembly = (pa) => {
      if (pa) {
        parentAssembly = pa;
        instance.trigger.parentSet();
      }
      return parentAssembly;
    }
    this.addSubAssembly = (assembly) => {
      assembly.parentAssembly(this);
      this.subassemblies[assembly.partCode()] = assembly;
    }

    this.objId = this.constructor.name;

    this.addJoints = function () {
      for (let i = 0; i < arguments.length; i += 1) {
        const joint = arguments[i];
        if (joint instanceof Joint) {
          const parent = joint.parentAssembly();
          if (parent === undefined) joint.parentAssembly(this);
          const mpc = joint.maleJointSelector();
          const fpc = joint.femaleJointSelector();
          const pc = this.locationCode();
          const locId = joint.locationId();
          if (locId) {
            this.joints.removeWhere(j => j.locationId() === locId);
          }
        }
        this.joints.push(joint.clone(this));
      }
    }

    this.addSubassemblies = function () {
      for (let i = 0; i < arguments.length; i += 1) {
        this.addSubAssembly(arguments[i]);
      }
    }

    this.children = () => Object.values(this.getSubassemblies(true));

    this.getSubassemblies = (childrenOnly) => {
      const assemblies = [];
      const subList = Object.values(this.subassemblies);
      subList.forEach((assem) => {
        assemblies.push(assem);
        if (!childrenOnly) assemblies.concatInPlace(assem.getSubassemblies());
      });
      return assemblies;
    }

    this.getParts = () => {
      return this.getSubassemblies().filter((a) => {
        return a.part() && a.included()
      });
    }

    this.isSubPart = (assem) => {
      assem.locationCode().startsWith(`${this.locationCode()}:`)
    }

    if (Assembly.idCounters[this.objId] === undefined) {
      Assembly.idCounters[this.objId] = 0;
    }

    Assembly.add(this);

    this.width = (value) => position.setDemension('x', value);
    this.length = (value) => position.setDemension('y', value);
    this.thickness = (value) => position.setDemension('z', value);
    this.toString = () => `${this.id()} - ${this.partName()}`;

    let buildCenter;
    this.buildCenter = (reevaluate) => {
      if (reevaluate === true) {
        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let minZ = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;
        let maxZ = Number.MIN_SAFE_INTEGER;
        const parts = instance.getParts();
        for (let index = 0; index < parts.length; index++) {
          const limits = parts[index].position().limits();
          minX = Math.min(minX, limits['-x']);
          minY = Math.min(minY, limits['-y']);
          minZ = Math.min(minZ, limits['-z']);
          maxX = Math.max(maxX, limits.x);
          maxY = Math.max(maxY, limits.y);
          maxZ = Math.max(maxZ, limits.z);
        }
        buildCenter = new Vertex3D({
          x: (maxX+minX)/2,
          y: (maxY+minY)/2,
          z: (maxZ+minZ)/2,
        });
      }
      return buildCenter;
    }

    const clear = (attr) => {
      if (this[attr] instanceof Function && this[attr].clearCache instanceof Function)
      this[attr].clearCache();
      return clear;
    }
    this.clearCaches = () => {
      //TODO: Find better way of reseting all caches
      clear('getJoints')('allAssemblies')('getAssembly')('hash')('toModel');
      this.children().forEach(c => c.clearCaches());
    }

    const normColors = ['red', 'green', 'blue'];
    const normalStr = (v,i,c) =>
      Line3D.fromVector(v.scale(10), c).toDrawString(normColors[i]);
    this.toDrawString = (notRecursive) => {
      let str = `//  ${this.userFriendlyId()}:${this.locationCode()}\n`;
      if (this.part() || notRecursive === true) {
        const model = this.toModel();
        const c = model.center();
        const norms = this.position().normals(true).map((v,i) => normalStr(v, i, c));
        const normStr = `//${norms[0]}\n//${norms[1]}\n//${norms[2]}\n`
        const modStr = model.toString().trim()
                        .replace(/(^|\n)/g, `$1${String.nextColor(...normColors)}`);
        str += `${normStr}${modStr}`;
      }
      if (notRecursive !== true)
        this.children().forEach(c => {try {str += c.toDrawString() + '\n\n'} catch (e) {}});
      return str;
    }

    this.on.change(() => {
      const joints = this.getJoints();
      jointList = joints.male.concat(joints.female);
      this.children().forEach(c => c.trigger.change());
    });
    this.on.change(() => instance.buildCenter(true));
    // defaultPartCode();
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

const positionReg = /^(c|r|d|center|rotation|demension)\.(x|y|z)$/;
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

  let groupVal;
  if (assembly.parentAssembly() === undefined) {
    const group = assembly.group();
    groupVal = group.resolve(assembly, attr);
  }
  const assemVal = assembly.value(attr);
  return Number.isFinite(assemVal) ? assemVal : groupVal;
}
Assembly.fromJson = (assemblyJson) => {
  const partCode = assemblyJson.partCode;
  const partName = assemblyJson.partName;
  const clazz = Object.class.get(assemblyJson._TYPE);
  const assembly = new (clazz)(partCode, partName, assemblyJson.config);
  assembly.id(assemblyJson.id);
  assembly.value.all(assemblyJson.value.values);
  assembly.parentAssembly(assemblyJson.parent)
  Object.values(assemblyJson.subassemblies).forEach((json) => {
    json.constructed = assembly.json;
    assembly.addSubAssembly(Object.fromJson(json));
  });
  const joints = Object.fromJson(assemblyJson.joints);
  assembly.addJoints.apply(assembly, joints);
  if (Array.isArray(assembly.subassemblies)) {
    console.log('wtff');
  }
  assembly.getJoints.clearCache()
  return assembly;
}

Assembly.classes = Object.class.object;
Assembly.new = function (id) {
  const clazz = Object.class.get(id);
  if (clazz)
    return new (clazz)(...Array.from(arguments).slice(1));
  return null;
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

Assembly.joinable = true;

// PartCode reg matches starting from the end aswell as at each simicolon
// The simicolon tells you that it is to be considered the preceding
// part number.

// Examples: partCode 'L'
//c-L:fifa                         :true
//c-LL                             :false
//c-L-lila:fifa                    :false

//c-L                              :true
//c-L-7                            :false

//m-q-p-L:1-2-4                    :true
//m-q-p-L-d:1-2-4                  :false

//m-q-p:1-2-4-L:fi-fi-fo-fum       :true
//m-q-p:1-2-4-L-4:fi-fi-fo-fum     :false

Assembly.partCodeReg = (partCode) => new RegExp(`(.{1,}?_|^)${partCode}(|:.*)$`);

module.exports = Assembly
