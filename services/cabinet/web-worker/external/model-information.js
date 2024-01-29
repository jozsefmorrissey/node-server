
const DTO = require('./data-transfer-object.js');
const MFC = require('../services/modeling/modeling-function-configuration.js');

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
      else if (a.locationCode().match(/_S1/)) sectionAssems.push(a);
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
  const obj = complexityObj[assembly.id()];
  if (obj.complexity) return;
  let complexity = NaN;
  if (assembly.locationCode() === 'c_T:b') {
    let a = 1 + 2;
  }

  obj.partCode = assembly.partCode();
  obj.joints = jointMap.female[id] || [];
  const dependentMatch = assembly.locationCode().match(dependentReg);
  obj.dependencies = [];
  if (dependentMatch) obj.dependencies.push(assembly.parentAssembly().id());
  obj.joints.forEach(jId => obj.dependencies.concatInPlace(jointMap.male[jId]));
  obj.complexity = () => {
    if (!Number.isNaN(complexity)) return complexity;
    if (assembly.includeJoints() === false && MFC.usesDefault(assembly.id())) return 1;
    complexity = 1;
    for (let index = 0; index < obj.dependencies.length; index++) {
      const id = obj.dependencies[index];
      if (complexityObj[id] === undefined) jointCompexityObject(id, complexityObj, jointMap, byId);
      complexity += complexityObj[id].complexity();
      if (Number.isNaN(complexity)) return NaN;
    }
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





const modelInfoObject = () => ({model: {}, joined: {}, intersection: {}, biPolygonArray: {}});

class ModelInformation {
  constructor(targetOs, props) {
    props ||= {};
    const instance = this;
    let targets = targetOs;
    if (!Array.isArray(targets)) targets = [targetOs];
    const assemblies = targets[0].allAssemblies();
    if (props.allRelatedParts === true) targets = assemblies.filter(a => a.part() && a.included());
    const modelInfo = props.modelInfo || modelInfoObject();
    const jointMap = assemblies[0].dependencyMap();
    const dependencies = assemblies[0].getAllDependencies();
    const byId = {};
    const propertyConfig = assemblies[0].group().propertyConfig();
    dependencies.forEach(j => byId[j.id()] = j);
    assemblies.forEach(a => byId[a.id()] = a);
    let buildModels;
    if (targets) buildModels = targets;
    else buildModels = assemblies.filter(a => a.part && a.included);

    let joinModels = sorter(buildModels, jointMap, byId);
    buildModels = Object.values(joinModels).map(ac => ac.assembly);
    buildModels = sortAssemMtdos(buildModels);

    this.buildModels = (models) => {
      if (models) {
        buildModels = models;
      }
      return buildModels;
    }
    this.joinModels = (models) => {
      if (models) {
        joinModels = models;
      }
      return joinModels;
    }

    const environmentObject = () => {
      const environment = DTO(props) || {};
      environment.byId = byId;
      environment.modelInfo = modelInfo;
      environment.propertyConfig = propertyConfig;
      environment.jointMap = jointMap;
      return environment;
    }

    this.environment = environmentObject;
    this.needsModeled = () => buildModels.filter(a => modelInfo.model[a.id()] === undefined);
    this.needsJoined = () => joinModels.filter(o => modelInfo.joined[o.assembly.id()] === undefined);
    this.needsIntersected = () => targets.filter(a => modelInfo.intersection[a.id()] === undefined);
    this.needsUnioned = () => unionedCsg ? [] : (props.partsOnly === false ? targets :
                          targets.filter(a => a.part() && a.included()));

    function addTrackingFunctions(...attributes) {
      for (let index = 0; index < attributes.length; index++) {
        const attr = attributes[index];
        instance[attr] = (id) => {
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
    addTrackingFunctions('model', 'joined', 'intersection', 'biPolygonArray')

    this.assemblies = () => assemblies;
    this.assembly = (id) => assemMap[id];

    let unionedCsg;
    this.unioned = (data) => {
      if (data) unionedCsg = CSG.fromPolygons(data.polygons, true);
      else return unionedCsg;
    }

    const attrPercent = (attr, list) => Object.values(modelInfo[attr]).length / list.length;
    this.status = () => ({
      models: buildModels ? attrPercent('model', buildModels) : null,
      joined: buildModels ? attrPercent('joined', joinModels) : null,
      intersection: buildModels ? attrPercent('intersection', joinModels) : null,
      biPolygonArray: buildModels ? attrPercent('biPolygonArray', buildModels) : null,
      unioned: unionedCsg ? true : false
    })
  }
}

const all = {};
const setModelInfomation = (root) => {
  all[root.id()] ||= ({
    hash: root.hash(),
    modelInfo: modelInfoObject(),
  });
  all[root.id()].lastAccess = new Date().getTime();
  return all[root.id()].modelInfo;
}

function related(target) {
  const root = target.getRoot();
  if (all[root.id()] === undefined) {
    return setModelInfomation(root);
  } else {
    const hash = root.hash();
    if (hash !== all[root.id()].hash) {
      all[root.id()] = undefined;
      return setModelInfomation(root);
    }
    return all[root.id()].modelInfo;
  }
}

function object(targetOs, props) {
  if (!Array.isArray(targetOs)) targetOs = [targetOs];
  const root = targetOs[0].getRoot();
  props ||= {};
  props.modelInfo = related(root);
  const itterator = new ModelInformation(targetOs, props);
  return itterator;
}


module.exports = {all, related, object};
