const StringMathEvaluator = require('../../../../../public/js/utils/string-math-evaluator.js');
const Position = require('../../position.js');
const Vertex3D = require('../../three-d/objects/vertex.js');
const Vector3D = require('../../three-d/objects/vector.js');
const Line3D = require('../../three-d/objects/line.js');
const KeyValue = require('../../../../../public/js/utils/object/key-value.js');
const FunctionCache = require('../../../../../public/js/utils/services/function-cache.js');
const Joint = require('../joint/joint');
const Dependency = require('../dependency');
const Group = require('../group');
const AssemblyResolver = require('./resolvers/assembly');
const ModelingCollections = require('modeling-collections');
const CustomEvent = require('../../../../../public/js/utils/custom-event.js');
const assemblyBuildConfig = require('../../../public/json/cabinets.json');
const JointSettings = require('../../../web-worker/shared/settings.js');
// const ToModel = require('../../../web-worker/services/to-model.js');

FunctionCache.on('hash', 250);
const valueOfunc = (valOfunc) => (typeof valOfunc) === 'function' ? valOfunc() : valOfunc;

function maxHeight(a, b, c) {
  const minSide = a > b ? b : a;
  return Math.sqrt(c*c - minSide*minSide);
}

class Assembly extends KeyValue {
  constructor(partCode, partName, config, parent) {
    // TODO should pass this in as and object
    super({childrenAttribute: 'subassemblies', parentAttribute: 'parentAssembly',
          object: true});

    new AssemblyResolver(this);
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
      outline: false,
      part: true,
      hardware: [],
      outsourced: false,
      digital: false,
      category: this.constructor.name,
      allModels: false,
      included: true,
      config, partCode: pCode, partName,
      locationCode: lCode,
      propertyId: undefined,
    }


    const subAssems = this.subassemblies;
    Object.getSet(this, initialVals, 'subassemblies', 'joints', 'name',  'normals', 'notes', 'jointSettings');
    Object.defineProperty(this, "subassemblies", {
      writable: false,
      enumerable: false,
      configurable: false,
      value: subAssems
    });
    Object.getSet(this, temporaryInitialVals);
    this.jointSettings = new JointSettings();
    this.hardware = [];
    this.path = () => `${this.constructor.name}.${partName}`.toDot();

    const parentIncluded = this.included;

    this.included = (value) => {
        value = parentIncluded(value);
        if ((typeof value) === 'string') {
          console.warn('what is this')
          return  group.propertyConfig(value);
        }
        switch (value) {
          case true: return true;
          case false: return false;
          default: return true;
        }
    }

    const pToJson = this.toJson;
    this.toJson = () => {
      const json = pToJson();
      json.joints = json.joints.filter(j => !j.locationId);
      return json;
    }

    const sme = new StringMathEvaluator({Math, maxHeight}, (expr) => this.resolve(expr));
    this.sme = () => sme;

    // KeyValue setup
    const funcReg = /length|width|thickness/;
    this.value.addCustomFunction((key, value) => key.match(funcReg) ? this[code](value) : undefined)
    this.value.evaluators.string = (value) => {
      const evaled = sme.eval(value, this);
      return Number.isNaN(evaled) ? value : evaled;
    }
    // this.value.defaultFunction = (key) => this.propertyConfig(this.constructor.name, key);

    this.eval = (eqn) => sme.eval(eqn, this);
    this.evalObject = (obj) => sme.evalObject(obj, this);

    const nonUserDefinedPartReg = /^c(_(S[0-9]{1,}|AUTOTK|COC|CabinetOpeningCorrdinates)(_|$)|$)/;
    this.userDefinedParts = () => this.allAssemblies().filter(a => !a.locationCode().match(nonUserDefinedPartReg));

    const changeEvent = new CustomEvent('change');
    this.on.change = changeEvent.on;
    this.trigger.change = changeEvent.trigger;
    let lastHash;
    function hash() {
      const valueObj = instance.value.values;
      let hashVal = Object.hash(valueObj);
      if (instance.parentAssembly() === undefined) hashVal += `${instance.length()}x${instance.width()}x${instance.thickness()}`.hash();
      hashVal += Object.hash(instance.config());
      hashVal += keyValHash();
      const subAssems = Object.values(instance.subassemblies).sortByAttr('id');
      for (let index = 0; index < subAssems.length; index++) {
        hashVal += subAssems[index].hash(true);
      }
      if (hashVal !== lastHash) {
        lastHash = hashVal;
        changeEvent.trigger.lastCall(instance.id() + 'Hash', 20, instance);
        return hash();
      }
      return hashVal;
    }

    const keyValHash = this.hash;
    this.hash = hash;

    let name;
    this.name = (value) => {
      const group = this.group();
      if (value) {
        const list = group && group.objects ? group.objects : [];
        name =  list.map(g => g.name()).uniqueStringValue(value);
      }
      return name;
    }

    this.userIdentifier = () => {
      const groupPrefix = this.group().room().groups.length > 1 ? `${this.group().name()}:` : '';
      return `${groupPrefix}${this.name() || this.userFriendlyId()}`;
    }

    this.group = (g) => {
      const root = instance.getRoot()
      if (root !== this && root.group) return root.group();
      if (g) group = g;
      return group;
    }
    this.layout = () => this.group().room().layout();
    this.propertyConfig = (...args) => {
      const group = this.getRoot().group();
      if (args.length === 0) return group.propertyConfig;
      if (group === undefined) return;
      const groupVal = group.resolve(...args);
      if (groupVal !== undefined) return groupVal;
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
    this.allAssemblies = allAssemblies;

    const constructUserFriendlyId = (idMap) => (part) => {
      const pc = part.partCode();
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

    this.groupIndex = () => {
      const group = this.group();
      const gIndex = group.objects.equalIndexOf(this);
      if (gIndex === -1) return 1;
      return gIndex + 1;
    }

    this.userFriendlyIdMap = new FunctionCache(buildUserFriendlyIdMap, this, 'alwaysOn');
    this.userFriendlyId = (id) => {
      if (id === undefined) `${this.partCode()}${this.groupIndex() + 1}`;
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

    let buildCenter;
    this.buildCenter = (reevaluate) => {
      if (reevaluate === true) {
        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let minZ = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;
        let maxZ = Number.MIN_SAFE_INTEGER;
        const parts = this.userDefinedParts();
        for (let index = 0; index < parts.length; index++) {
          const limits = parts[index].position().limits();
          minX = Math.min(minX, limits.x, limits['-x']);
          minY = Math.min(minY, limits.y, limits['-y']);
          minZ = Math.min(minZ, limits.z, limits['-z']);
          maxX = Math.max(maxX, limits.x, limits['-x']);
          maxY = Math.max(maxY, limits.y, limits['-y']);
          maxZ = Math.max(maxZ, limits.z, limits['-z']);
        }
        buildCenter = new Vertex3D({
          x: (maxX+minX)/2,
          y: (maxY+minY)/2,
          z: (maxZ+minZ)/2,
        });
      }
      return buildCenter || new Vertex3D();
    }
    this.on.change(() => instance.buildCenter(true));


    this.getAssembly = new FunctionCache(getAssembly, this, 'alwaysOn');
    this.getAssemblies = (partCodeOlocationCodeOassemblyOregexOfunc) => {
      const assemblies = this.allAssemblies();
      const matches = [];
      for (let index = 0; index < assemblies.length; index++) {
        const assem = assemblies[index];
        if (assem.match && assem.match(partCodeOlocationCodeOassemblyOregexOfunc))
          matches.push(assem);
      }
      matches.sortByAttr('partCode');
      return matches;
    }

    this.match = (partCodeOlocationCodeOassemblyOregexOfunc) => {
      let pclcarf = partCodeOlocationCodeOassemblyOregexOfunc;
      if (pclcarf instanceof Function) return pclcarf(this) === true;
      if ((typeof pclcarf) === 'string') pclcarf = new RegExp(`^${pclcarf}(:.*|)$`);
      if (pclcarf instanceof RegExp) {
        return null !== (this.partCode().match(pclcarf) || this.locationCode().match(pclcarf));
      }
      return this === pclcarf;
    }

    let position = new Position(this, sme, config);
    this.config = position.configuration;

    this.position = () => position;
    this.updatePosition = () => position = new Position(this, sme);
    this.joints = [];
    this.rootAssembly = () => {
      let currAssem = this;
      while (currAssem.parentAssembly() !== undefined) currAssem = currAssem.parentAssembly();
      return currAssem;
    }

    let normObj;
    const ensureVector = (cno, attr) => cno[attr].length === 2 ?
                            cno[attr] = new Line3D(this.evalObject(cno[attr][0]), this.evalObject(cno[attr][1])).vector().unit() :
                            (cno[attr] instanceof Vector3D ? cno[attr] :
                            cno[attr] = new Vector3D(this.eval(cno[attr][0]), this.eval(cno[attr][1]), this.eval(cno[attr][2])).unit());

    let lastNormHash;
    this.normals = (array, normalObj) => {
      const currHash = Object.hash(normalObj);
      const settingNorms = lastNormHash !== currHash && normalObj instanceof Object;
      if (settingNorms) {
        lastNormHash = currHash;
        if (!Array.isArray(normalObj)) normObj = normalObj;
        else normObj = {x: normalObj[0], y: normalObj[1], z: normalObj[2]};
        normObj.calc = normalObj.calc;
        return normObj;
      }
      if (array !== true && array !== false) return normObj;
      if (normObj === undefined) return;
      if (normObj.DETERMINE_FROM_MODEL) return normObj;
      if (!normObj.x && !normObj.y && !normObj.z) return undefined;
      const calcNormObj = this.evalObject(normObj);
      if (normObj.calc !== 0) ensureVector(calcNormObj, 'x');
      if (normObj.calc !== 1) ensureVector(calcNormObj, 'y');
      if (normObj.calc !== 2) ensureVector(calcNormObj, 'z');
      if (normObj.calc === 0) calcNormObj.x = calcNormObj.y.crossProduct(calcNormObj.z).unit();
      if (normObj.calc === 1) calcNormObj.y = calcNormObj.x.crossProduct(calcNormObj.z).unit();
      if (normObj.calc === 2) calcNormObj.z = calcNormObj.x.crossProduct(calcNormObj.y).unit();
      return array ? (calcNormObj ? [calcNormObj.x, calcNormObj.y, calcNormObj.z] : undefined) : calcNormObj;
    }

    this.getDependencies = (assem) => {
      assem ||= this;
      const root = this.getRoot();
      if (root !== this) return root.getDependencies(assem);
      const assemList = this.allAssemblies().filter(a => a instanceof Assembly);
      let allJoints =[];// this.getDependencyList();;
      assemList.forEach((assem) => allJoints.concatInPlace(assem.getDependencyList()));
      let joints = {male: [], female: []};
      const addJoint = (joint) => {
        if (joint.dependsOn(assem)) {
          joints.male.push(joint);
        } else if (joint.isDependent(assem)) {
          joints.female.push(joint);
        }
      };
      allJoints.forEach(addJoint);
      jointList = joints.male.concat(joints.female);
      return joints;
    };

    this.getDependencyList = () => Object.values(namedDependencies).concat(this.joints);

    this.getAllDependencies = (assem) => {
      assem ||= this;
      const root = this.getRoot();
      if (root !== this) return root.getDependencies(assem);

      const assemList = this.allAssemblies();
      let allJoints = [];
      // if (assem) allJoints.concatInPlace(assem.joints);
      assemList.forEach((a) => a.getDependencyList && allJoints.concatInPlace(a.getDependencyList()));
      return allJoints;
    };

    this.undefinedPartCode = (partCode, requireIndex) => this.subassemblies.undefinedKey(partCode, '-', requireIndex);
    this.dependencyMap = (assems) => {
      assems ||= this.allAssemblies();
      const allJs = this.getRoot().getAllDependencies();
      const jMap = {female: {}, male: {}, JOINTS: [], DEPENDENCIES: []};
      for (let ji = 0; ji < allJs.length; ji++) {
        const joint = allJs[ji];
        jMap[joint instanceof Joint ? 'JOINTS' : 'DEPENDENCIES'].push(joint);
        if (!joint.apply()) continue;

        const jid = joint.id();
        for (let ai = 0; ai < assems.length; ai++) {
          const assem = assems[ai];
          if (!(assem instanceof Assembly)) continue;
          const aid = assem.id();
          if (jMap[jid] === undefined) jMap[jid] = {male: [], female: []};
          if (joint.dependsOn(assem)) {
            if (!jMap.male[aid]) jMap.male[aid] = [];
            jMap.male[aid].push(jid);
          }

          if (assem.included()) {
            if (joint.dependsOn(assem)) {
              jMap[jid].male.push(aid);
            }
            if (joint.isDependent(assem)) {
              jMap.female[aid] ||= [];
              jMap.female[aid].push(jid);
              jMap[jid].female.push(aid);
            }
          }
        }
      }
      return jMap;
    }

    this.dependencyMap.readable = () => {
      const dm = this.dependencyMap();
      const obj = {female: {}, male: {}};
      const get = Cutter.get;
      Object.keys(dm.female).forEach(k => obj.female[get(k).locationCode()] = dm.female[k].map(k => get(k).descriptor()));
      Object.keys(dm.male).forEach(k => obj.male[get(k).locationCode()] = dm.male[k].map(k => get(k).descriptor()));
      Object.keys(dm).filter(k => !k.match(/^(male|female)$/)).forEach(k => obj[get(k).descriptor()] = {male: dm[k].male.map(id => get(id).locationCode()), female: dm[k].female.map(id => get(id).locationCode())})
      return obj;
    }


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
      this.addDependencies(new Dependency(this, assembly, null, 'parent'));
    }

    const namedDependencies = {};
    this.addDependencies = function () {
      for (let i = 0; i < arguments.length; i += 1) {
        const joint = arguments[i];
        if (joint.evaluator) joint.evaluator(this.eval);
        if (joint instanceof Dependency) {
          const locId = joint.locationId();
          if (locId) namedDependencies[locId] = joint.clone();
          else this.joints.push(joint.clone());
        }
      }
    }

    this.addSubassemblies = function () {
      for (let i = 0; i < arguments.length; i += 1) {
        this.addSubAssembly(arguments[i]);
      }
    }

    this.children = () => Object.values(this.getSubassemblies(true));
    this.isChild = (assem) => this.children().indexOf(assem) !== -1;

    this.getSubassemblies = (childrenOnly) => {
      const assemblies = [];
      const subList = Object.values(this.subassemblies);
      subList.forEach((assem) => {
        assemblies.push(assem);
        if (!childrenOnly) assemblies.concatInPlace(assem.getSubassemblies());
      });
      return assemblies;
    }

    this.getParts = (simple) => this.getSubassemblies().filter((a) => a.part() && a.included());

    const userDefinedReg = /^[^_^:]{1,}?_([^_^:]*$|AUTOTK_OpenTK:)/;
    this.modelingCollections = new ModelingCollections(this);

    this.composite = (composite) => this.children().length > 0;

    this.modifiableValues = () => {
      const valueObj = this.value.values;
      const keys = Object.keys(valueObj);
      return keys.filter(key => {
        const value = valueObj[key];
        return value.match instanceof Function && !value.match(/[a-zA-Z]/);
      }).map(str => ({key: str, value: this.eval(valueObj[str])}));
    }

    this.isSubPart = (assem) =>
      assem.locationCode().startsWith(`${this.locationCode()}:`)

    if (Assembly.idCounters[this.objId] === undefined) {
      Assembly.idCounters[this.objId] = 0;
    }

    Assembly.add(this);

    this.width = (value) => position.setDemension('x', value);
    this.length = (value) => position.setDemension('y', value);
    this.thickness = (value) => position.setDemension('z', value);
    this.toString = () => `${this.id()} - ${this.partName()}`;

    const clear = (attr) => {
      if (this[attr] instanceof Function && this[attr].clearCache instanceof Function)
      this[attr].clearCache();
      return clear;
    }

    const normColors = ['red', 'green', 'blue'];
    const normalStr = (v,i,c) =>
      Line3D.fromVector(v.scale(10), c).toDrawString(normColors[i]);
    this.toDrawString = (notRecursive) => {
      let str = `//  ${this.userFriendlyId()}:${this.locationCode()}\n`;
      if (this.part() || notRecursive === true) {
        const model = ToModel(this);
        const c = model.center();
        const norms = this.position().normals(true).map((v,i) => normalStr(v, i, c));
        const normStr = `//${norms[0]}\n//${norms[1]}\n//${norms[2]}\n`
        const modStr = model.toString().trim()
                        .replace(/(^|\n)/g, `$1${String.color.next(...normColors)}`);
        str += `${normStr}${modStr}`;
      }
      if (notRecursive !== true)
        this.children().forEach(c => {try {str += c.toDrawString() + '\n\n'} catch (e) {}});
      return str;
    }

    this.on.change(() => {
      const joints = this.getDependencies();
      jointList = joints.male.concat(joints.female);
      this.children().forEach(c => c.trigger.change());
    });
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
  let assemVal = assembly.value(attr);
  if (assemVal === undefined && assembly.resolver) assemVal = assembly.resolver(attr);
  return Number.isFinite(assemVal) ? assemVal : groupVal;
}
Assembly.fromJson = (assemblyJson) => {
  const partCode = assemblyJson.partCode;
  const partName = assemblyJson.partName;
  const clazz = Object.class.get(assemblyJson._TYPE);
  const assembly = new (clazz)(partCode, partName, assemblyJson.config);
  assembly.id(assemblyJson.id);
  assembly.name(assemblyJson.name);
  assembly.normals(null, assemblyJson.normals);
  assembly.outline( assemblyJson.outline);
  assembly.notes(assemblyJson.notes);
  assembly.value.all(assemblyJson.value.values);
  if (assemblyJson.parent) assembly.parentAssembly(assemblyJson.parent);
  else {
    assembly.group(assemblyJson.group || new Group());
    assembly.part(false);
  }
  Object.values(assemblyJson.subassemblies).forEach((json) => {
    json.constructed = assembly.json;
    json.parent = assembly;
    assembly.addSubAssembly(Object.fromJson(json));
  });
  const joints = Object.fromJson(assemblyJson.joints);
  assembly.addDependencies.apply(assembly, joints);
  return assembly;
}

Assembly.build = (type, group, config, assembly) => {
  group ||= new Group();
  assembly ||= new Assembly('c', type);
  assembly.group(group);
  config ||= assemblyBuildConfig[type];
  assembly.length(config.height);
  assembly.width(config.width);
  assembly.thickness(config.thickness);
  config.values.forEach((value) => assembly.value(value.key, value.eqn));
  assembly.value('dividerJoint', Object.fromJson(config.dividerJoint));

  config.subassemblies.forEach((subAssemConfig) => {
    const type = subAssemConfig.type;
    const name = subAssemConfig.name;

    const posConfig = subAssemConfig.positionMethod === 'poly' ? subAssemConfig.polyConfig : {
      demension: subAssemConfig.demensions.join(':'),
      center: subAssemConfig.center.join(':'),
      rotation: subAssemConfig.rotation.join(':')
    }
    const subAssem = Assembly.new(type, subAssemConfig.code, name, posConfig);
    subAssem.outline(true);
    // TODO: This should use Object.fromJson so more complex objects can easily save/load values.
    if (subAssem.jointSetIndex) {
      subAssem.jointSetIndex(subAssemConfig.jointSetIndex);
      subAssem.includedSides(subAssemConfig.includedSides);
    }
    if (subAssemConfig.normalInfo && subAssemConfig.normalInfo.style !== 'rotation') {
      subAssemConfig.normalInfo.normals.calc = subAssemConfig.normalInfo.calc;
      let normalsObj;
      if (subAssemConfig.normalInfo.style === 'line') normalsObj = subAssemConfig.normalInfo.lines;
      if (subAssemConfig.normalInfo.style === 'vector') normalsObj = subAssemConfig.normalInfo.normals;
      if (normalsObj) {
        normalsObj.calc = subAssemConfig.normalInfo.calc;
        subAssem.normals(true,  normalsObj);
      }
    }
    subAssem.partCode(subAssemConfig.code);
    assembly.addSubAssembly(subAssem);
  });

  const regReg = /^\/.*^\//;
  config.joints.forEach((jointConfig) => {
    jointConfig = jointConfig.copy();
    const male = assembly.getAssembly(jointConfig.selector.depends);
    if (male === undefined) console.warn(`No male found for joint: ${jointConfig}`);
    male.addDependencies(Object.fromJson(jointConfig));
    assembly.trigger.change();
  });

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

ModelingCollections.Assembly = Assembly;
module.exports = Assembly
