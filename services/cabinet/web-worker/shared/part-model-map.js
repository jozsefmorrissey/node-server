
const JointDto = require('./web-worker-models').JointDto;
const JU = require('../services/joint');

const jointCompexityObject = (id, complexityObj) => {
  const assembly = complexityObj[id].assembly;
  const obj = complexityObj[assembly.id()];
  if (obj.complexity) return;
  let complexity = NaN;
  obj.partCode = assembly.partCode();
  obj.joints = assembly.getJoints().female;
  obj.dependencies = [];
  obj.joints.forEach(j => obj.dependencies.concatInPlace(j.men().map(m => m.id())));
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

const sorter = (assemblies) => {
  assemblies = assemblies.filter(a => a.toModel instanceof Function);
  const complexityObj = {};
  assemblies.forEach(a => (complexityObj[a.id()] = {assembly: a}));
  let index = 0;
  while(index < assemblies.length) {
    const assem = assemblies[index];
    const obj = jointCompexityObject(assem.id(), complexityObj);
    if (obj) obj.dependencies.forEach(id => jointCompexityObject(id, complexityObj));
    index++;
  }
  const objs = Object.values(complexityObj);
  objs.sortByAttr('complexity');
  return objs;
}

class PartModelMap {
  constructor(assembliesDto) {
    assemblies = sorter(assemblies);
    const assemMap = {};
    assemblies.forEach(a => assemMap[id] = a);
    const modelMap = {};
    const biPolygonMap = {};
    const joints = assemblies.getAllJoints().map(j => new JointDto(j));


    // Need to have some way of determining if a model is not returned...
    this.nextAssembly = () => assemblies[index++];
    this.model = (id, model) => {
      if (model !== undefined) {
        modelMap[id] = model;
      }
      return modelMap[id];
    }
    this.biPolygon = (id, biPoly) => {
      if (biPoly !== undefined) {
        biPolygonMap[id] = biPoly;
      }
      return biPolygonMap[id];
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


module.exports = PartModelMap;
