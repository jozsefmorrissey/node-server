
const MDTO = require('../services/modeling/modeling-data-transfer-object.js');
const MFC = require('../services/modeling/modeling-function-configuration.js');


const sortUnderScoreCount = (a, b) => {
  const aC = a.locationCode().count('_');
  const bC = b.locationCode().count('_');
  if (aC !== bC) return aC - bC;
  return a.locationCode().length - b.locationCode().length;
}

function sortAssemMtdos(assemMtdos) {
  let cab, back;
  const defaultBuilt = [];
  const customBuilt = [];
  const sectionAssems = [];
  for (let index = 0; index < assemMtdos.length; index++) {
    const a = assemMtdos[index];
    if (a.partCode() === 'BACK') back = a;
    else {
      if (MFC.usesDefault(a.id(), a.partName()) === true) defaultBuilt.push(a);
      else if (a.locationCode().match(/_S1/)) sectionAssems.push(a);
      else customBuilt.push(a);
    }
  }
  defaultBuilt.sortByAttr(sortUnderScoreCount);
  customBuilt.sortByAttr(sortUnderScoreCount);
  sectionAssems.sortByAttr(sortUnderScoreCount);
  const list = []
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
  obj.dependencies.forEach(id => jointCompexityObject(id, complexityObj, jointMap, byId));
  obj.complexity = () => {
    if (!Number.isNaN(complexity)) return complexity;
    complexity = 1;
    for (let index = 0; index < obj.dependencies.length; index++) {
      const id = obj.dependencies[index];
      if (complexityObj[id] === undefined) jointCompexityObject(id, complexityObj, jointMap, byId);
      complexity += complexityObj[id].complexity();
      if (Number.isNaN(complexity)) return NaN;
    }
    return complexity;
  }
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

const needsToBeRendered = (jointMap, targetMdto, byId) => {
  if (targetMdto === undefined) return assemblies.map(a => a);
  const needsSearched = [targetMdto];
  let buildModels = {};
  let index = 0;
  while(needsSearched.length > index) {
    const assem = needsSearched[index];
    buildModels[assem.id()] = assem;
    const associatedJoints = jointMap.female[assem.id()];
    for (let aji = 0; associatedJoints && aji < associatedJoints.length; aji++) {
      const jointId = associatedJoints[aji];
      const maleIds = jointMap.male[jointId];
      for (let midi = 0; midi < maleIds.length; midi++) {
        const maleId = maleIds[midi];
        if (buildModels[maleId] === undefined) {
          needsSearched.push(maleId);
          buildModels[maleId] = byId[maleId];
        }
      }
    }
    index++;
  }
  return Object.values(buildModels);
}





class ModelInformation {
  constructor(targetOs, props) {
    props ||= {};
    let targets = targetOs;
    if (!Array.isArray(targets)) targets = [targetOs];
    const assemblies = targets[0].allAssemblies();
    if (props.all === true) targets = assemblies.filter(a => a.part() && a.included());
    const modelInfo = props.modelInfo || {};
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

    const environmentObject = () => {
      const environment = MDTO.to(props) || {};
      environment.byId = byId;
      environment.modelInfo = modelInfo;
      environment.propertyConfig = propertyConfig;
      environment.jointMap = jointMap;
      return environment;
    }

    this.environment = environmentObject;
    this.buildModels = () => buildModels.filter(a => modelInfo[a.id()] === undefined || modelInfo[a.id()].model === undefined);
    this.joinModels = () => joinModels.filter(o => modelInfo[o.assembly.id()] === undefined ||
                                modelInfo[o.assembly.id()].joinedModel === undefined);
    this.slicedModels = () => targets.filter(a => modelInfo[a.id()] === undefined ||
                                modelInfo[a.id()].joinedModel === undefined ||
                                Object.keys(modelInfo[a.id()].joinedModel).length < 2);

    this.modelInfo = (id) => {
      return modelInfo[id];
    }

    this.modelInfos = (modelInfoMap) => {
      const keys = Object.keys(modelInfoMap);
      for (let index = 0; index < keys.length; index++) {
        const id = keys[index];
        modelInfo[id] = modelInfoMap[id];
      }
      return this;
    }
    this.joinedModels = (joinedModelMap) => {
      const keys = Object.keys(joinedModelMap);
      for (let index = 0; index < keys.length; index++) {
        const id = keys[index];
        modelInfo[id].joinedModel = joinedModelMap[id];
      }
      return this;
    }

    this.joints = () => joints;
    // this.joints.female = (dto) => {
    //   return joints.filter(j => isMatch(j.femaleJointSelector(), dto));
    // }
    this.assemblies = () => assemblies;
    this.assembly = (id) => assemMap[id];
    this.models = (filter) => {
      const runFilter = filter instanceof Function;
      filter ||= !props.all ? (mtdo) => targets.find(a => a.id().equals(mtdo.id())) :
                            (mtdo) => mtdo.part && mtdo.included;
      let csg = new CSG();
      const ids = Object.keys(modelInfo);
      for (let index = 0; index < ids.length; index++) {
        const id = ids[index];
        if (modelInfo[id]) {
          let model = modelInfo[id].joinedModel.final;
          const mtdo = byId[id];
          if (mtdo.partCode() === 'R:full') {
            let a = 1 +2;
          }
          if (model && filter(mtdo, model)) {
            if (!(model instanceof CSG)) model = CSG.fromPolygons(model.polygons, true);
            csg = csg.union(model);
          }
        }
      }
      return csg.polygons.length > 0 ? csg : null;
    }
    this.percentBuilt = () =>
        Object.values(modelInfo).length / buildModels.length;
  }
}

const all = {};
const setModelInfomation = (root) => {
  all[root.id()] ||= ({
    hash: root.hash(),
    modelInfo: {},
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
