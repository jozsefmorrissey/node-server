
const Lookup = require('../../../../../public/js/utils/object/lookup.js');
const BiPolygon = require('../../three-d/objects/bi-polygon.js');
const Polygon3D = require('../../three-d/objects/polygon.js');
// const Assembly = require('../assembly/assembly.js');

const REASSIGNMENT_ERROR = () => new Error('Make a new joint, joints cannot be reassined');

function isMatch(partCodeOlocationCodeOassemblyOregex, obj) {
  let pclcar = partCodeOlocationCodeOassemblyOregex;
  if ((typeof pclcar) === 'string') pclcar = new RegExp(`^${pclcar}(:.*|)$`);
  if (pclcar instanceof RegExp) {
    return obj.partCode().match(pclcar) || obj.locationCode().match(pclcar);
  }
  return obj === pclcar;
}

function getModels(partCodeOlocationCodeOassemblyOregex, filter, joint) {
  let pclcar = partCodeOlocationCodeOassemblyOregex;
  const parent = joint.parentAssembly();
  if (parent === undefined) throw new Error(`You need to set parentAssembly for '${joint.toString()}'`);
  const joinable = parent.allAssemblies().filter(a => a.constructor.joinable);
  let models = [];
  const runFilter = filter instanceof Function;
  for (let index = 0; index < joinable.length; index++) {
    const male = joinable[index];
    try {
      if (male.includeJoints() && isMatch(pclcar, male) && (!runFilter || filter(male))) {
        const model = male.toModel();
        if (model !== undefined) {
          models.push(male.toModel());
        }
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

let distSorter = (s1, s2) => {
  if (s1.length !== 2 && s2.length !== 2) return 0;
  if (s1.length !== 2) return 1;
  if (s2.length !== 2) return -1;
  return s2[0].distance(s2[1]) - s1[0].distance(s1[1]);
}

Joint.apply = (model, joints) => {
  if (!joints || !Array.isArray(joints)) return model;
  let m = model; // preventCouruption
  joints.forEach((joint) => {
    if (joint.apply()) {
      try {
        const maleModel = joint.maleModel(joints.jointFilter);
        if (m.polygons.length > 0 && maleModel && maleModel.polygons.length > 0) {
          // if (joint.fullLength()) {
          //   const intersection = Polygon3D.fromCSG(maleModel.intersect(m));
          //   const sets = Polygon3D.parrelleSets(intersection);
          //   sets.sort(distSorter);
          //   const vector = sets[0][0].center().vector().minus(sets[0][1].center()).unit()
          //   let front = sets[0][0];//.translate(vector.scale(10000000));
          //   let back = sets[0][1];//.translate(vector.scale(-10000000));
          //   if (!front.isClockwise()) front = front.reverse();
          //   if (!back.isClockwise()) back = back.reverse();
          //   const biPoly = new BiPolygon(sets[0][0], sets[0][1]);
          //   m = m.subtract(biPoly.toModel());
          // } else {
            m = m.subtract(maleModel);
          // }
        }
      } catch (e) {
        console.error('Most likely caused by a circular joint reference',e);
      }
    }
  });
  return m;
}

class JointReferences {
  constructor(parent, getJoints, origPartCode) {
    const initialVals = {
      origPartCode
    }
    Object.getSet(this, initialVals);

    this.clone = () => new JointReferences(parent, getJoints, origPartCode);

    this.list = () => {
      const orig = getJoints();
      const list = [];
      for (let index = 0; index < orig.length; index++) {
        let j = orig[index];
        if (j.femaleJointSelector() === origPartCode) j = j.clone(parent, null, parent.locationCode());
        else if (j.maleJointSelector() === origPartCode) j = j.clone(parent, parent.locationCode());
        // j.maleOffset(-.9525/2);
        list.push(j);
      }
      return list;
    }
  }
}

class JointApplicator {
  constructor(assembly) {
    const joints = assembly.getAllJoints();

    function isMatch(partCodeOlocationCodeOassemblyOregex, obj) {
      let pclcar = partCodeOlocationCodeOassemblyOregex;
      if ((typeof pclcar) === 'string') pclcar = new RegExp(`^${pclcar}(:.*|)$`);
      if (pclcar instanceof RegExp) {
        return obj.partCode().match(pclcar) || obj.locationCode().match(pclcar);
      }
      return obj === pclcar;
    }

    function getModels(partCodeOlocationCodeOassemblyOregex, filter, joint) {
      let pclcar = partCodeOlocationCodeOassemblyOregex;
      const parent = joint.parentAssembly();
      if (parent === undefined) throw new Error(`You need to set parentAssembly for '${joint.toString()}'`);
      const joinable = parent.allAssemblies().filter(a => a.constructor.joinable);
      let models = [];
      const runFilter = filter instanceof Function;
      for (let index = 0; index < joinable.length; index++) {
        const male = joinable[index];
        try {
          if (male.includeJoints() && isMatch(pclcar, male) && (!runFilter || filter(male))) {
            const model = male.toModel();
            if (model !== undefined) {
              models.push(male.toModel());
            }
          }
        } catch (e) {
          console.warn(e);
        }
      }
      return models;
    }

    this.maleModels = (filter) => getModels(maleJointSelector, filter, this);
    this.femaleModels = (filter) => getModels(femaleJointSelector, filter, this);

    this.maleModel = (filter) => {
      const models = this.maleModels(filter);
      let model = new CSG();
      for (let index = 0; index < models.length; index++) {
        model = model.union(models[index]);
      }
      return model;
    }

    this.apply = (model) => {
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
          }
        }
      });
      return m;
    }
  }
}


Joint.References = JointReferences;

module.exports = Joint
