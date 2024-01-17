
const JU = require('../services/modeling/utils/joint.js');
const MDTO = require('../services/modeling/modeling-data-transfer-object.js');

const jointCompexityObject = (id, complexityObj, jointMap, byId) => {
  const assembly = complexityObj[id].assembly;
  const obj = complexityObj[assembly.id];
  if (obj.complexity) return;
  let complexity = NaN;
  obj.partCode = assembly.partCode;
  obj.joints = jointMap.female[id] || [];
  obj.dependencies = [];
  obj.joints.forEach(jId => obj.dependencies.concatInPlace(jointMap.male[jId]));
  obj.complexity = () => {
    if (!Number.isNaN(complexity)) return complexity;
    complexity = 1;
    for (let index = 0; index < obj.dependencies.length; index++) {
      const id = obj.dependencies[index];
      complexity += complexityObj[id].complexity();
      if (Number.isNaN(complexity)) return NaN;
    }
    return complexity;
  }
  return obj;
}

const sorter = (assemblies, jointMap) => {
  const complexityObj = {};
  assemblies.forEach(a => (complexityObj[a.id] = {assembly: a}));
  let index = 0;
  while(index < assemblies.length) {
    const assem = assemblies[index];
    const obj = jointCompexityObject(assem.id, complexityObj, jointMap);
    if (obj) obj.dependencies.forEach(id => jointCompexityObject(id, complexityObj, jointMap));
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
  constructor(assemblies, target) {
    const jointMap = MDTO.to(assemblies[0].jointMap());
    const jointMdtos = MDTO.to(assemblies[0].getAllJoints());
    const assemMdtos = MDTO.to(assemblies);
    const byId = {};
    jointMdtos.forEach(j => byId[j.id] = j);
    assemMdtos.forEach(a => byId[a.id] = a);
    const targetMdto = MDTO.to(target);
    let needsRendered = sorter(assemMdtos, jointMap);//needsToBeRendered(jointMap, targetMdto, byId);

    let modelMap = {};
    let nextIndex = 0;
    this.nextJob = () => {
      if (nextIndex > needsRendered.length-1) return null;
      const next = needsRendered[nextIndex++];
      return {byId, modelMap, assembly: next.assembly, joints: next.joints};
    }
    this.model = (id, model) => {
      if (model !== undefined) {
        modelMap[id] = model;
      }
      return modelMap[id];
    }

    this.joints = () => joints;
    this.joints.female = (dto) => {
      return joints.filter(j => isMatch(j.femaleJointSelector(), dto));
    }
    this.assemblies = () => assemblies;
    this.assembly = (id) => assemMap[id];
    this.models = (filter) => {
      const runFilter = filter instanceof Function;
      const csg = new CSG();
      const ids = Object.keys(modelMap);
      for (let index = 0; index < ids.length; index++) {
        const model = modelMap[ids[index]];
        if (!runFilter || filter(id, model)) {
          csg = csg.union(model);
        }
      }
      return csg;
    }
    this.percentComplete = () =>
        Object.values(modelMap).length / assemblies.length;

  }
}


module.exports = ModelItterator;
