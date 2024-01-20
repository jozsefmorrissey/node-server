
const MDTO = require('../services/modeling/modeling-data-transfer-object.js');
const MFC = require('../services/modeling/modeling-function-configuration.js');


const sortUnderScoreCount = (a, b) => {
  const aC = a.locationCode.count('_');
  const bC = b.locationCode.count('_');
  if (aC !== bC) return aC - bC;
  return a.locationCode.length - b.locationCode.length;
}

function sortAssemMtdos(assemMtdos) {
  let cab, back;
  const defaultBuilt = [];
  const customBuilt = [];
  const sectionAssems = [];
  for (let index = 0; index < assemMtdos.length; index++) {
    const a = assemMtdos[index];
    if (a.partCode === 'c') cab = a;
    else if (a.partCode === 'BACK') back = a;
    else {
      if (MFC(a, true) === false) defaultBuilt.push(a);
      else if (a.locationCode.match(/_S1/)) sectionAssems.push(a);
      else customBuilt.push(a);
    }
  }
  defaultBuilt.sortByAttr(sortUnderScoreCount);
  customBuilt.sortByAttr(sortUnderScoreCount);
  sectionAssems.sortByAttr(sortUnderScoreCount);
  const list = []
  if (cab) list.push(cab); if (back) list.push(back);
  return list.concat(defaultBuilt.concat(customBuilt.concat(sectionAssems)));
}

const dependentReg = /(.{1,}):.{1}/;
const jointCompexityObject = (id, complexityObj, jointMap, byId) => {
  if (complexityObj[id] === undefined) {
    complexityObj[id] = {assembly: byId[id]};
  }
  const assembly = complexityObj[id].assembly;
  const obj = complexityObj[assembly.id];
  if (obj.complexity) return;
  let complexity = NaN;
  if (assembly.locationCode === 'c_T:b') {
    let a = 1 + 2;
  }

  obj.partCode = assembly.partCode;
  obj.joints = jointMap.female[id] || [];
  const dependentMatch = assembly.locationCode.match(dependentReg);
  obj.dependencies = [];
  if (dependentMatch) obj.dependencies.push(assembly.parentAssembly.id);
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
    const obj = jointCompexityObject(assem.id, complexityObj, jointMap, byId);
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
  let needsRendered = {};
  let index = 0;
  while(needsSearched.length > index) {
    const associatedJoints = jointMap.female[needsSearched[index].id];
    for (let aji = 0; associatedJoints && aji < associatedJoints.length; aji++) {
      const jointId = associatedJoints[aji];
      const maleIds = jointMap.male[jointId];
      for (let midi = 0; midi < maleIds.length; midi++) {
        const maleId = maleIds[midi];
        if (needsRendered[maleId] === undefined) {
          needsSearched.push(maleId);
          needsRendered[maleId] = byId[maleId];
        }
      }
    }
    index++;
  }
  return Object.values(needsRendered);
}





class ModelItterator {
  constructor(assemblies, targets) {
    if (targets && !Array.isArray(targets)) targets = [targets];
    const jointMap = MDTO.to(assemblies[0].jointMap());
    const jointMdtos = MDTO.to(assemblies[0].getAllJoints());
    const assemMdtos = MDTO.to(assemblies);
    const byId = {};
    const propertyConfig = MDTO.to(assemblies[0].group().propertyConfig());
    jointMdtos.forEach(j => byId[j.id] = j);
    assemMdtos.forEach(a => byId[a.id] = a);
    if (targets) targets = MDTO.to(targets);
    else targets = assemMdtos.filter(a => a.part && a.included);
    // const targetMdto = MDTO.to(target);
    assemMdtos.shuffle();
    let needsJoined = sorter(targets, jointMap, byId);//needsToBeRendered(jointMap, targetMdto, byId);
    let needsRendered = Object.values(needsJoined).map(ac => ac.assembly);
    needsRendered = sortAssemMtdos(needsRendered);


    const modelInfo = {}
    let nextIndex = 0;
    this.nextJob = () => {
      if (nextIndex < needsRendered.length) {
        const assembly = needsRendered[nextIndex++];
        const environment = {byId, modelInfo, propertyConfig};
        return {name: 'build-model', assembly, environment};
      } else if (nextIndex < needsRendered.length + 1) {
        nextIndex++;
        const environment = {byId, modelInfo, jointMap, propertyConfig};
        return {name: 'apply-joints', assemblies: needsJoined, environment};
      } else return null;
    }
    this.modelInfo = (id, info) => {
      if (id === undefined) return modelInfo;
      if (info !== undefined) {
        modelInfo[id] = info;
      }
      return modelInfo[id];
    }
    this.joinedModels = (joinedModelMap) => {
      const keys = Object.keys(joinedModelMap);
      for (let index = 0; index < keys.length; index++) {
        const id = keys[index];
        modelInfo[id].joinedModel = joinedModelMap[id];
      }
    }

    this.joints = () => joints;
    this.joints.female = (dto) => {
      return joints.filter(j => isMatch(j.femaleJointSelector(), dto));
    }
    this.assemblies = () => assemblies;
    this.assembly = (id) => assemMap[id];
    this.models = (filter) => {
      const runFilter = filter instanceof Function;
      filter ||= (mtdo) => mtdo.part && mtdo.included;
      let csg = new CSG();
      const ids = Object.keys(modelInfo);
      for (let index = 0; index < ids.length; index++) {
        const id = ids[index];
        const model = modelInfo[id].joinedModel;
        const mtdo = byId[id];
        if (model && filter(mtdo, model)) {
          csg = csg.union(model);
        }
      }
      return csg.polygons.length > 0 ? csg : null;
    }
    this.percentBuilt = () =>
        Object.values(modelInfo).length / needsRendered.length;
  }
}


module.exports = ModelItterator;
