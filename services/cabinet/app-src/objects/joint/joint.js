
const Lookup = require('../../../../../public/js/utils/object/lookup.js')
// const Assembly = require('../assembly/assembly.js');

const REASSIGNMENT_ERROR = () => new Error('Make a new joint, joints cannot be reassined');

class Joint {
  constructor(malePartCode, femalePartCode, condition, locationId) {
    let parent, parentId;
    const initialVals = {
      maleOffset: 0, femaleOffset: 0, parentAssemblyId:  undefined,
      malePartCode, femalePartCode, demensionAxis: '', centerAxis: '',
      locationId
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

    this.clone = (parentOid, malePartCode, femalePartCode, cond, locId) => {
      const mpc = malePartCode || this.malePartCode();
      const fpc = femalePartCode || this.femalePartCode();
      locId ||= locationId;
      parentOid ||= this.parentAssembly() || this.parentAssemblyId();
      const clone = Object.class.new(this, mpc, fpc, cond || condition, locId);
      clone.maleOffset(this.maleOffset());
      clone.femaleOffset(this.femaleOffset());
      clone.demensionAxis(this.demensionAxis());
      clone.centerAxis(this.centerAxis());
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
    this.isFemale = (assem) => {
      if (parent === undefined) return false;
      femaleReg ||= parent.constructor.partCodeReg(femalePartCode);
      return assem.partCode(true).match(femaleReg) !== null;
    }

    this.isMale = (assem) => {
      if (parent === undefined) return false;
      maleReg ||= parent.constructor.partCodeReg(malePartCode);
      return assem.partCode(true).match(maleReg) !== null;
    }

    this.malePartCode = (pc) => {
      if (pc && malePartCode) throw new Error('Create new Joint cannot be reassined');
      if (pc) {
        malePartCode = pc;
      }
      return malePartCode;
    }

    this.femalePartCode = (pc) => {
      if (pc && femalePartCode) throw new Error('Create new Joint cannot be reassined');
      if (pc) {
        femalePartCode = pc;
      }
      return femalePartCode;
    }

    this.maleModels = (filter) => {
      if (parent === undefined) throw new Error(`You need to set parentAssembly for '${this.toString()}'`);
      const mens = parent.getAssembly(malePartCode, true);
      let models = [];
      const runFilter = filter instanceof Function;
      for (let index = 0; index < mens.length; index++) {
        const male = mens[index];
        try {
          if ((!runFilter || filter(male)) && male.includeJoints()) {
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

    this.maleModel = (filter) => {
      if (parent === undefined) throw new Error(`You need to set parentAssembly for '${this.toString()}'`);
      const models = this.maleModels(filter);
      let model = new CSG();
      for (let index = 0; index < models.length; index++) {
        model = model.union(models[index]);
      }
      return model;
    }

    this.getDemensions = () => {
      const malePos = male();
      const femalePos = female();
      // I created a loop but it was harder to understand
      throw new Error('this is nonsense who is using it?...');
      return undefined;
    }
    this.toString = () => `${this.constructor.name}(${locationId}):${this.malePartCode()}->${this.femalePartCode()}`;

    if (Joint.list[this.malePartCode()] === undefined) Joint.list[this.malePartCode()] = [];
    if (Joint.list[this.femalePartCode()] === undefined) Joint.list[this.femalePartCode()] = [];
    Joint.list[this.malePartCode()].push(this);
    Joint.list[this.femalePartCode()].push(this);
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
        if (j.femalePartCode() === origPartCode) j = j.clone(parent, null, parent.partCode(true));
        else if (j.malePartCode() === origPartCode) j = j.clone(parent, parent.partCode(true));
        // j.maleOffset(-.9525/2);
        list.push(j);
      }
      return list;
    }
  }
}

Joint.References = JointReferences;

module.exports = Joint
