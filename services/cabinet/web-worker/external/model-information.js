
const DTO = require('./data-transfer-object.js');

const MFC = require('../internal/services/modeling/modeling-function-configuration.js');
const Line2d = require('../../../../public/js/utils/canvas/two-d/objects/line.js');
const Polygon2d = require('../../../../public/js/utils/canvas/two-d/objects/polygon.js');

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
    if (assembly.includeJoints === undefined) return 1;
    if (dependencyCount === obj.dependencies.length) return complexity;
    if (assembly.includeJoints() === false && MFC.usesDefault(assembly.id())) return 1;
    complexity = 1;
    for (let index = 0; index < obj.dependencies.length; index++) {
      const id = obj.dependencies[index];
      if (complexityObj[id] === undefined) jointCompexityObject(id, complexityObj, jointMap, byId);
      complexity += complexityObj[id].complexity();
      if (Number.isNaN(complexity)) return NaN;
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



const dataConverters = {
  threeView: (data) => {
    if (data.front[0] instanceof Line2d) return data;
    data.front = data.front.map(d => new Line2d(d[0], d[1]));
    data.right = data.right.map(d => new Line2d(d[0], d[1]));
    data.top = data.top.map(d => new Line2d(d[0], d[1]));
    data.threeView = data.threeView.map(d => new Line2d(d[0], d[1]));
    data.parimeter.threeView = data.parimeter.threeView.map(d => new Line2d(d[0], d[1]));
    data.parimeter.front = new Polygon2d(data.parimeter.front.vertices);
    data.parimeter.right = new Polygon2d(data.parimeter.right.vertices);
    data.parimeter.top = new Polygon2d(data.parimeter.top.vertices);
    return data;
  }
}

const modelInfoObject = () => ({threeView: {}, model: {}, joined: {}, intersection: {}, biPolygonArray: {}});

class ModelInformation {
  constructor(targetOs, props) {
    props ||= {};
    const instance = this;
    let targets = targetOs;
    if (!Array.isArray(targets)) targets = [targetOs];
    targets = targets.map(a => a);
    const assemblies = targets[0].allAssemblies();
    if (props.allRelatedParts === true) targets = assemblies.filter(a => a.part() && a.included());
    const modelInfo = props.modelInfo || modelInfoObject();
    const jointMap = assemblies[0].dependencyMap(props.noJoints);
    const byId = {};
    const propertyConfig = assemblies[0].group().propertyConfig();
    assemblies.forEach(a => byId[a.id()] = a);
    let buildModels;
    if (targets) buildModels = targets;
    const root = targets[0].getRoot();
    if (buildModels.indexOf(root) === -1) buildModels.push(root);
    else buildModels = assemblies.filter(a => a.part && a.included);

    let joinModels = sorter(buildModels, jointMap, byId);
    buildModels = Object.values(joinModels).map(ac => ac.assembly);
    buildModels = sortAssemMtdos(buildModels);

    buildModels = buildModels.map(a => a.id());
    const includedParts = targets.filter(a => a.part() && a.included()).map(a => a.id());
    targets = targets.map(a => a.id());
    const complexityMap = {};
    joinModels.forEach(jmo => complexityMap[jmo.assembly.id()] = jmo.complexity());
    joinModels.forEach(jmo => (jmo.id = jmo.assembly.id()) && delete jmo.assembly &&
                                                              delete jmo.partCode &&
                                                              delete jmo.complexity);
    let requiresReference = {};
    buildModels.forEach(id => requiresReference[id] = byId[id]);
    targets.forEach(id => requiresReference[id] = byId[id]);
    joinModels.forEach(jmo => requiresReference[jmo.id] = byId[jmo.id]);
    joinModels = joinModels.map(jmo => jmo.id);
    const dependencies = assemblies[0].getAllDependencies(null, props.noJoints);
    dependencies.forEach(j => requiresReference[j.id()] = j);

    this.needsModeled = () => buildModels;//.filter(id => modelInfo.model[id] === undefined);
    this.needsJoined = () => joinModels;//.filter(id => modelInfo.joined[id] === undefined);
    this.needsIntersected = () => targets.filter(id => byId[id].part());// && modelInfo.intersection[id] === undefined);
    this.needsUnioned = () => unionedCsg ? [] :
                            (props.partsOnly === false ? targets : includedParts);
    this.needs2dConverted = () => props.unioned ? unioned2D ? [] : [{}]:
          targets.filter(id => !id.startsWith('Cutter'));// && modelInfo.threeView[id] === undefined);

    const environmentObject = () => {
      const environment = DTO(props) || {};
      environment.byId = requiresReference;
      environment.modelInfo = modelInfoObject();//modelInfo;
      environment.propertyConfig = propertyConfig;
      environment.jointMap = jointMap;
      return environment;
    }
    this.environment = environmentObject;

    this.parts = () => byId;
    this.jointMap = () => jointMap;
    this.complexityMap = () => complexityMap;

    function addTrackingFunctions(...attributes) {
      for (let index = 0; index < attributes.length; index++) {
        const attr = attributes[index];
        instance[attr] = (id) => {
          id = id + '';
          let obj = modelInfo[attr][id];
          if (!obj) return obj;
          if (dataConverters[attr]) modelInfo[attr][id] = dataConverters[attr](obj);
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

    this.assemblies = () => assemblies;
    this.assembly = (id) => assemMap[id];

    let unionedCsg;
    this.unioned = (data) => {
      if (data) unionedCsg = CSG.fromPolygons(data.polygons, true);
      else return unionedCsg;
    }

    let partInformation;
    this.partInformation = (info) => {
      if (info) modelInfo.partInformation = info;
      else return modelInfo.partInformation;
    }

    let unioned2D
    this.unioned2D = (data) => {
      if (data) unioned2D = data;
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
