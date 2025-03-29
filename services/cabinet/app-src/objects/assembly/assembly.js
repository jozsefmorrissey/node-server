const StringMathEvaluator = require('../../../../../public/js/utils/string-math-evaluator.js');
const Position = require('../../position.js');

const {Vertex3D, Vector3D, Line3D} = require('../../../../../public/js/utils/canvas/three-d/lib');

const KeyValue = require('../../../../../public/js/utils/object/key-value.js');
const FunctionCache = require('../../../../../public/js/utils/services/function-cache.js');
const Joint = require('../joint/joint');
const Dependency = require('../dependency');
const AssemblyResolver = require('./resolvers/assembly');
const ModelingCollections = require('modeling-collections');
const CustomEvent = require('../../../../../public/js/utils/custom-event.js');
const assemblyBuildConfig = require('../../../public/json/cabinets/construction.json');
const JointSettings = require('../../../web-worker/shared/settings.js');
const Properties = require('../../config/properties.js');
const Utils = require('../../utils')
const AssemblyConfiguration = require('configuration');

// FunctionCache.on('hash', 250);
const valueOfunc = (valOfunc) => (typeof valOfunc) === 'function' ? valOfunc() : valOfunc;

function maxHeight(a, b, c) {
  const minSide = a > b ? b : a;
  return Math.sqrt(c*c - minSide*minSide);
}

class Assembly extends KeyValue {
  constructor(partCode, partName, config, parent) {
    if (config && Object.values(config).find(v => v instanceof Function) || (typeof v === 'string') && v.match(/.{1,}:.{1,}:.{1,}/))
        throw new Error('old format')
    // TODO should pass this in as and object
    super({childrenAttribute: 'subassemblies', parentAttribute: 'parentAssembly',
          object: true});

    config = new AssemblyConfiguration(this, config);
    config.toJson();
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
      manuallyConfigurable: false,
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
    Object.getSet(this, initialVals, 'subassemblies', 'joints', 'name', 'notes', 'jointSettings');
    Object.defineProperty(this, "subassemblies", {
      writable: false,
      enumerable: false,
      configurable: false,
      value: subAssems
    });
    Object.getSet(this, temporaryInitialVals);
    this.color = (color) => {
      this.group().propertyConfig('color', color);
      return this.resolve('color', true);
    }
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
      if (this.normals.raw) json.normals = this.normals.raw();
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

    this.properties = () => {
      const propGroup = Properties.groups()[this.constructor.name];
      propGroup.map((p, i) => this.resolve(p.code(), true));
      console.log(propGroup);
      return propGroup;
    }

    this.eval = (eqn) => sme.eval(eqn, this);
    this.evalObject = (obj) => sme.evalObject(obj, this);

    const userDefinedPartReg = /^c_(?!(S|COC|AUTOTK))([^_^|^:]{1,})$/;
    this.userDefinedParts = () => this.allAssemblies().filter(a => a.locationCode().match(userDefinedPartReg));

    CustomEvent.all(this, 'change', 'processing');
    let lastHash;
    function hash() {
      let hashVal = (instance.id()+'').hash();
      if (config && config.manual()) hashVal += Object.hash(instance.config);
      else hashVal += `${instance.length()}x${instance.width()}x${instance.thickness()}`.hash();
      hashVal += keyValHash();
      const subAssems = Object.values(instance.subassemblies);
      for (let index = 0; index < subAssems.length; index++) {
        hashVal += subAssems[index].hash(true);
      }
      if (hashVal !== lastHash) {
        lastHash = hashVal;
        instance.trigger.change();
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
      if (!pc.includes(':')) return pc;
      const parent = part.parentAssembly();
      if (parent) {
        return `:${part.id()}`;
      }
      return pc;
    }

    this.generatedParts = [];

    const subPartReg = /(.*?):.*/;
    function buildUserFriendlyIdMap() {
      let unidentified = this.allAssemblies().concat(this.generatedParts);
      unidentified.sort(Assembly.inheritanceSorter);
      const idMap = {};
      do {
        const split = unidentified.filterSplit(constructUserFriendlyId(idMap));
        const keys = Object.keys(split);
        for(let index = 0; index < keys.length; index++) {
          let key = keys[index];
          let si = 0;
          if (key.startsWith(':')) {
            const part = Assembly.get(key.substring(1));
            key = idMap[part.parentAssembly().id()] + part.partCode(true);
            split[key] ||= [];
            si = split[key].length;
            split[key].push(part);
          }
          const set = split[key];
          for (;si < set.length; si++) {
            // TODO: eliminate all hardCoded partCode Indicies and insure children
            //      share the same userFriendlyId Index as parent.
            idMap[set[si].id()] = `${key}${si ? si : ''}`;
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
      id ||= this.id();
      if (this.parentAssembly() !== undefined) return this.getRoot().userFriendlyIdMap()[id];
      return this.userFriendlyIdMap()[id] || Assembly.get(id).locationCode();
    }
    this.userFriendlyIndex = () =>
      (this.userFriendlyId().replace(/^.*?([0-9]*)$/, '$1') || 0) + 1;


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

    let position = new Position(this, sme);
    this.property('config', config, false, false, false);

    this.position = () => position;
    this.position.object = () => ({
      vector: new Vector3D(this.center()).minus(this.buildCenter(true)),
      rotation: position.rotation()
    });
    this.updatePosition = () => position = new Position(this, sme);
    this.joints = [];
    this.rootAssembly = () => {
      let currAssem = this;
      while (currAssem.parentAssembly() !== undefined) currAssem = currAssem.parentAssembly();
      return currAssem;
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
    this.ancestors = () => {
      const parents = [];
      let curr = this.parentAssembly();
      while (curr) {
        parents.push(curr);
        curr = this.parentAssembly();
      }
      return parents;
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

    this.isSubPart = (assem) => assem.parentAssembly() === this;

    if (Assembly.idCounters[this.objId] === undefined) {
      Assembly.idCounters[this.objId] = 0;
    }

    Assembly.add(this);

    const rotOcentOdem = (attr) => (x,y,z) =>
            new Vertex3D(!Defined.one(x,y,z) ?
                      this.evalObject(this.config.POSITION[attr]) :
                      this.evalObject(this.config.POSITION[attr].set(x,y,z)));
    const rotOcentOdemSINGLE = (attr, axis) => () =>
      this.eval(this.config.POSITION[attr][axis]);

    ['rotation', 'center', 'demension']
            .forEach(attr => (this[attr] = rotOcentOdem(attr)) &
                    (this[attr].x = rotOcentOdemSINGLE(attr, 'x')) &
                    (this[attr].y = rotOcentOdemSINGLE(attr, 'y')) &
                    (this[attr].z = rotOcentOdemSINGLE(attr, 'z')));

    this.normals = this.config.normals;

    this.width = (value) => value === undefined ? this.eval(this.config.POSITION.demension.x) :
                            this.eval(this.config.POSITION.demension.x = value);
    this.length = (value) => value === undefined ? this.eval(this.config.POSITION.demension.y) :
                            this.eval(this.config.POSITION.demension.y = value);
    this.thickness = (value) => value === undefined ? this.eval(this.config.POSITION.demension.z) :
                            this.eval(this.config.POSITION.demension.z = value);

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
        const norms = this.normals(true).map((v,i) => normalStr(v, i, c));
        const normStr = `//${norms[0]}\n//${norms[1]}\n//${norms[2]}\n`
        const modStr = model.toString().trim()
                        .replace(/(^|\n)/g, `$1${Color.next(...normColors)}`);
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

Assembly.fromJson = (assemblyJson) => {
  const partCode = assemblyJson.partCode;
  const partName = assemblyJson.partName;
  const clazz = Object.class.get(assemblyJson._TYPE);


  assemblyJson.config.normalInfo = assemblyJson.normalInfo;
  assemblyJson.config.polyConfig = assemblyJson.polyConfig;


  const assembly = new (clazz)(partCode, partName, assemblyJson.config);
  assembly.id(assemblyJson.id);
  assembly.name(assemblyJson.name);
  assembly.outline( assemblyJson.outline);
  assembly.notes(assemblyJson.notes);
  assembly.value.all(assemblyJson.value.values);
  if (assemblyJson.parent) assembly.parentAssembly(assemblyJson.parent);
  else {
    assembly.group(assemblyJson.group);
    assembly.part(false);
  }
  Object.values(assemblyJson.subassemblies).forEach((json) => {
    json.parent = assembly;
    assembly.addSubAssembly(Object.fromJson(json));
  });
  const joints = Object.fromJson(assemblyJson.joints);
  assembly.addDependencies.apply(assembly, joints);
  return assembly;
}

Assembly.build = (type, group, config, assembly) => {
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
    if (posConfig) posConfig.normalInfo = subAssemConfig.normalInfo;
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
Assembly.inheritanceSorter = (a1,a2) => {
  const loc1 = a1.locationCode();
  const loc2 = a2.locationCode();
  return loc1.count('_') - loc2.count('_') || loc1.length - loc2.length;
}

ModelingCollections.Assembly = Assembly;
module.exports = Assembly
