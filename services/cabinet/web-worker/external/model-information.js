
const DTO = require('./data-transfer-object.js');

const MFC = require('../internal/services/modeling/modeling-function-configuration.js');
const Line2d = require('../../../../public/js/utils/canvas/two-d/objects/line.js');
const Polygon2d = require('../../../../public/js/utils/canvas/two-d/objects/polygon.js');
const Cutter = require('../../app-src/objects/assembly/assemblies/cutter.js');
const Assembly = require('../../app-src/objects/assembly/assembly');

const PartInformation = require('./part-information');

// TODO: move sorting/filtering functions to worker-bundle
const sortUnderScoreCount = (a, b) => {
  const aC = a.locationCode().count('_:');
  const bC = b.locationCode().count('_:');
  if (aC !== bC) return aC - bC;
  return a.locationCode() - b.locationCode();
}

function sortAssemMtdos(assemMtdos) {
  let cab, back, aoc;
  const defaultBuilt = [];
  const customBuilt = [];
  const sectionAssems = [];
  for (let index = 0; index < assemMtdos.length; index++) {
    const a = assemMtdos[index];
    if (a.partCode() === 'BACK') back = a;
    else if (a.partCode() === 'aoc') aoc = a;
    else {
      if (MFC.usesDefault(a.id(), a.partName()) === true) defaultBuilt.push(a);
      else if (a.locationCode().match(/_S/)) sectionAssems.push(a);
      else customBuilt.push(a);
    }
  }
  defaultBuilt.sort(sortUnderScoreCount);
  customBuilt.sort(sortUnderScoreCount);
  sectionAssems.sort(sortUnderScoreCount);
  const list = []
  if (aoc) defaultBuilt.push(aoc);
  if (back) list.push(back);
  return list.concat(defaultBuilt.concat(customBuilt.concat(sectionAssems)));
}

const dependentReg = /(.{1,}):.{1}/;
const jointCompexityObject = (id, complexityObj, jointMap, byId) => {
  if (complexityObj[id] === undefined) {
    complexityObj[id] = {assembly: byId[id]};
  }
  const assembly = complexityObj[id].assembly;
  let obj;
  try {
    obj = complexityObj[assembly.id()];
  } catch (e) {
    console.log(e);
  }
  if (obj.complexity) return;
  let complexity = 1;
  let dependencyCount = 0;

  obj.partCode = assembly.partCode();
  obj.joints = jointMap.female[id] || [];
  const dependentMatch = assembly.locationCode().match(dependentReg);
  obj.dependencies = [];
  if (assembly.parentAssembly()) obj.dependencies.push(assembly.parentAssembly().id());
  obj.joints.forEach(jId => obj.dependencies.concatInPlace(jointMap[jId].male));
  obj.complexity = () => {
    if (!(assembly instanceof Assembly) || assembly.jointSettings.noDependencies()) return 1;
    if (MFC.usesDefault(assembly.id(), assembly.partName())) return 1;
    if (dependencyCount === obj.dependencies.length) return complexity;
    // TODO: probably need to qualify this with joint config somehow
    complexity = 1;
    for (let index = 0; index < obj.dependencies.length; index++) {
      const id = obj.dependencies[index];
      if (id === assembly.id()) console.warn('Assembly is dependent on itself. Something probably needs cleaned up');
      else {
        if (complexityObj[id] === undefined) jointCompexityObject(id, complexityObj, jointMap, byId);
        complexity += complexityObj[id].complexity();
        if (Number.isNaN(complexity)) return NaN;
      }
    }
    dependencyCount = obj.dependencies.length;
    return complexity;
  }
  obj.dependencies.forEach(id => jointCompexityObject(id, complexityObj, jointMap, byId));
  return obj;
}

const sorter = (assemblies, jointMap, byId) => {
  const complexityObj = {};
  let index = 0;
  while(index < assemblies.length) {
    const assem = assemblies[index];
    const obj = jointCompexityObject(assem.id(), complexityObj, jointMap, byId);
    if (obj) obj.dependencies.forEach(id => jointCompexityObject(id, complexityObj, jointMap, byId));
    index++;
  }
  const objs = Object.values(complexityObj);
  objs.sortByAttr('complexity');
  return objs;
}

const modelInfoObject = () => ({threeView: {}, model: {}, joined: {}, intersection: {}, biPolygonArray: {}, extended: {}, cut: {}});
class ModelingConfiguration {
  constructor(assembly) {
    const instance = this;
    const root = assembly.getRoot();
    const hash = root.hash();
    this.root = () => root;
    this.hash = () => hash;
    this.id = () => root.id();

    let assemblies = root.modelingCollections();
    let allAssemblies = root.allAssemblies();
    const byId = {};
    const propertyConfig = root.group().propertyConfig().values(root.resolve, true);

    allAssemblies.forEach(a => byId[a.id()] = a);
    assemblies = sortAssemMtdos(assemblies);
    const nonDigitalList = allAssemblies.filter(a => a instanceof Assembly &&
                          a.included() && a.part() && !a.digital()).map(a=>a.id());
    assemblies = assemblies.map(a => a.id());

    const complexityMap = {};
    const jointMap = root.dependencyMap(allAssemblies.filter(a => a.part() && !a.composite()));
    jointMap.JOINTS.forEach(j => byId[j.id()] = j);
    allAssemblies = sorter(allAssemblies, jointMap, byId);
    allAssemblies.forEach(amo => complexityMap[amo.assembly.id()] = amo.complexity());
    allAssemblies = allAssemblies.filter(amo => amo.assembly.part() && amo.assembly.included())
                                  .map(amo => amo.assembly.id());

    this.needsModeled = () => allAssemblies;
    this.needsJoined = () => nonDigitalList;
    this.needsIntersected = () => nonDigitalList;
    this.needsUnioned = () => nonDigitalList;
    this.needs2dConverted = () => assemblies;

    this.parts = () => byId;
    this.jointMap = () => jointMap;
    this.complexityMap = () => complexityMap;

    const environmentObject = () => {
      const environment = {};
      environment.byId = byId;
      environment.modelInfo = modelInfoObject();
      environment.propertyConfig = propertyConfig;
      environment.jointMap = jointMap;
      environment.generated = [];
      return environment;
    }
    this.environment = environmentObject;

    this.assemblies = () => assemblies;
  }
}



class ModelInformation {
  constructor(assembly, modelConf) {
    const instance = this;
    const modelInfo = modelInfoObject();
    this.info = () => modelInfo;

    this.modelingConfiguration = () => modelConf;
    this.needsModeled = modelConf.needsModeled;
    this.needsJoined =  modelConf.needsJoined;
    this.needsIntersected =  modelConf.needsIntersected;
    this.needsUnioned =  modelConf.needsUnioned;
    this.needs2dConverted =  modelConf.needs2dConverted;

    function addTrackingFunctions(...attributes) {
      for (let index = 0; index < attributes.length; index++) {
        const attr = attributes[index];
        instance[attr] = (id) => {
          id = id + '';
          let obj = modelInfo[attr][id];
          if (!obj) return obj;
          if (obj.polygons && !(obj instanceof CSG))
            modelInfo[attr][id] = CSG.fromPolygons(obj.polygons, true);
          return modelInfo[attr][id];
        }

        instance[`${attr}Map`] = (modelMap) => {
          const keys = Object.keys(modelMap);
          for (let index = 0; index < keys.length; index++) {
            const id = keys[index];
            modelInfo[attr][id] = modelMap[id];
          }
        }
      }
    }
    addTrackingFunctions('threeView', 'model', 'joined', 'intersection', 'biPolygonArray')

    let unionObj;
    this.unioned = (...keys) => {
      if (keys.length === 0) keys = ['all'];
      let csg = new CSG();
      keys.forEach(k => unionObj[k] instanceof CSG && (csg.polygons.concatInPlace(unionObj[k].clone().polygons)));
      return csg;
    }

    this.unioned.silhouettes = () => unionObj.silhouettes;
    this.unioned.boxOnly = () => unionObj.boxOnly;
    this.unioned.all = () => unionObj;
    this.unioned.set = (data) => {
      const keys = Object.keys(data);
      if (data) {
        unionObj = {};
        for (let index = 0; index < keys.length; index++) {
          const key = keys[index];
          if (Array.isArray(data[key].polygons)) {
            unionObj[key] = CSG.fromPolygons(data[key].polygons, true);
          } else {
            unionObj[key] = data[key];
          }
        }
      }
      return unionObj;
    }

    let unioned2D
    this.unioned2D = (data) => {
      if (data) unioned2D = data;
      else return unioned2D;
    }
  }
}

class ConstructionModelInfo extends ModelInformation {
  constructor(assem, modelConf) {
    super(assem, modelConf);
    const parentEnviroment = this.environment;
    this.modelInfo = () => modelInfo;
    this.environment = () => {
      const env = modelConf.environment();
      env.expandParts = true;
      return env;
    }
    this.partInformation = new PartInformation(modelConf.root());
  }
}

class DisplayModelInfo extends ModelInformation {
  constructor(assem, modelConf) {
    super(assem, modelConf);
    this.modelInfo = () => modelInfo;
    this.environment = modelConf.environment;
  }
}

const infos = {DisplayModelInfo: {},
              ConstructionModelInfo: {},
              ModelingConfiguration: {}};

function objectGetter(cxtr) {
  const name = cxtr.name;
  return (assembly) => {
    const _HASH = assembly.hash()
    const id = assembly.id();
    if (infos[name][id] && infos[name][id]._HASH === _HASH)
      return infos[name][id].modelInfo;
    const modelConf = cxtr === ModelingConfiguration ? null : config(assembly);
    return (infos[name][id] = {_HASH, modelInfo: new cxtr(assembly, modelConf)}).modelInfo;
  }
}

const display = objectGetter(DisplayModelInfo);
const construction = objectGetter(ConstructionModelInfo);
const config = objectGetter(ModelingConfiguration);

module.exports = {construction, display, config};
