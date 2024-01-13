
const Lookup = require('../../../../../public/js/utils/object/lookup.js');
const BiPolygon = require('../../three-d/objects/bi-polygon.js');
const Polygon3D = require('../../three-d/objects/polygon.js');
// const Assembly = require('../assembly/assembly.js');

const REASSIGNMENT_ERROR = () => new Error('Make a new joint, joints cannot be reassined');

function isMatch(partCodeOlocationCodeOassemblyOregexOfunc, obj) {
  let pclcarf = partCodeOlocationCodeOassemblyOregexOfunc;
  if (pclcarf instanceof Function) return pclcarf(obj) === true;
  if ((typeof pclcarf) === 'string') pclcarf = new RegExp(`^${pclcarf}(:.*|)$`);
  if (pclcarf instanceof RegExp) {
    return null !== (obj.partCode().match(pclcarf) || obj.locationCode().match(pclcarf));
  }
  return obj === pclcarf;
}

const matchFilter = (pclcarf, filter) => {
  const runFilter = filter instanceof Function;
  return (a) => {
    return a.constructor.joinable && a.includeJoints() && isMatch(pclcarf, a) && (!runFilter || filter(a));
  }
}

function getMatches (partCodeOlocationCodeOassemblyOregexOfunc, filter, joint) {
  let pclcarf = partCodeOlocationCodeOassemblyOregexOfunc;
  const parent = joint.parentAssembly();
  if (parent === undefined) throw new Error(`You need to set parentAssembly for '${joint.toString()}'`);
  return parent.allAssemblies().filter(matchFilter(pclcarf, filter, joint));
}

function getModels(partCodeOlocationCodeOassemblyOregexOfunc, filter, joint) {
  let pclcarf = partCodeOlocationCodeOassemblyOregexOfunc;
  const joinable = getMatches(pclcarf, filter, joint);
  let models = [];
  for (let index = 0; index < joinable.length; index++) {
    const assem = joinable[index];
    try {
      const model = assem.toModel();
      if (model !== undefined) {
        models.push(assem.toModel());
      }
    } catch (e) {
      console.warn(e);
    }
  }
  return models;
}

class Joint {
  constructor(maleJointSelector, femaleJointSelector, condition, locationId) {
    let parent, parentId;
    const initialVals = {
      maleOffset: 0, femaleOffset: 0, parentAssemblyId:  undefined,
      maleJointSelector, femaleJointSelector, demensionAxis: '', centerAxis: '',
      locationId, fullLength: false,
    }
    Object.getSet(this, initialVals);

    this.apply = () => (typeof condition === 'function') ? condition(this) : true;

    this.parentAssemblyId = (id) => {
      if (id && parentId) throw REASSIGNMENT_ERROR();
      if (id) {
        parentId = id;
        this.parentAssembly();
      }
      return parentId;
    }

    this.clone = (parentOid, maleJointSelector, femaleJointSelector, cond, locId) => {
      const mpc = maleJointSelector || this.maleJointSelector();
      const fpc = femaleJointSelector || this.femaleJointSelector();
      locId ||= locationId;
      parentOid ||= this.parentAssembly() || this.parentAssemblyId();
      const clone = Object.class.new(this, mpc, fpc, cond || condition, locId);
      clone.maleOffset(this.maleOffset());
      clone.femaleOffset(this.femaleOffset());
      clone.demensionAxis(this.demensionAxis());
      clone.centerAxis(this.centerAxis());
      clone.fullLength(this.fullLength());
      if ((typeof parentOid) === 'string') clone.parentAssemblyId(parentOid);
      else clone.parentAssembly(parentOid);
      return clone;
    }

    this.parentAssembly = (p) => {
      if (parent && p)  throw REASSIGNMENT_ERROR();
      if (p) {
        parent = p;
      }
      if (!parent && this.parentAssemblyId()) {
        parent = Lookup.get(this.parentAssemblyId());
      }
      return parent;
    }

    this.updatePosition = () => {};

    let maleReg, femaleReg;
    this.isFemale = (assem) => isMatch(femaleJointSelector, assem);
    this.isMale = (assem) => isMatch(maleJointSelector, assem);
    this.men = (filter) => getMatches(maleJointSelector, filter, this);
    this.women = (filter) => getMatches(maleJointSelector, filter, this);

    this.maleJointSelector = (pc) => {
      if (pc && maleJointSelector) throw new Error('Create new Joint cannot be reassined');
      if (pc) {
        maleJointSelector = pc;
      }
      return maleJointSelector;
    }

    this.femaleJointSelector = (pc) => {
      if (pc && femaleJointSelector) throw new Error('Create new Joint cannot be reassined');
      if (pc) {
        femaleJointSelector = pc;
      }
      return femaleJointSelector;
    }

    this.maleModels = (filter) => getModels(maleJointSelector, filter, this);

    this.maleModel = (filter) => {
      if (parent === undefined) throw new Error(`You need to set parentAssembly for '${this.toString()}'`);
      const models = this.maleModels(filter);
      let model = new CSG();
      for (let index = 0; index < models.length; index++) {
        model = model.union(models[index]);
      }
      return model;
    }

    this.femaleModels = (filter) => getModels(femaleJointSelector, filter, this);

    this.getDemensions = () => {
      const malePos = male();
      const femalePos = female();
      // I created a loop but it was harder to understand
      throw new Error('this is nonsense who is using it?...');
      return undefined;
    }
    this.toString = () => `${this.constructor.name}(${locationId}):${this.maleJointSelector()}->${this.femaleJointSelector()}`;

    if (Joint.list[this.maleJointSelector()] === undefined) Joint.list[this.maleJointSelector()] = [];
    if (Joint.list[this.femaleJointSelector()] === undefined) Joint.list[this.femaleJointSelector()] = [];
    Joint.list[this.maleJointSelector()].push(this);
    Joint.list[this.femaleJointSelector()].push(this);
  }
}
Joint.list = {};
Joint.regex = /([a-z0-9-_\.]{1,})->([a-z0-9-_\.]{1,})/;

Joint.classes = {};
Joint.register = (clazz) => {
  new clazz();
  Joint.classes[clazz.prototype.constructor.name] = clazz;
}
Joint.new = function (id, json) {
  return new Joint.classes[id]().fromJson(json);
}

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

Joint.sorter = (assemblies) => {
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

Joint.apply = (model, joints) => {
  if (!joints || !Array.isArray(joints)) return model;
  let m = model; // preventCouruption
  joints.forEach((joint) => {
    if (joint.apply()) {
      try {
        const maleModel = joint.maleModel(joints.jointFilter);
        if (m.polygons.length > 0 && maleModel && maleModel.polygons.length > 0) {
          m = m.subtract(maleModel);
        }
      } catch (e) {
        console.error('Most likely caused by a circular joint reference',e);
        const cp = joint.parentAssembly()
        cp.parentAssembly().build()
      }
    }
  });
  return m;
}


module.exports = Joint
