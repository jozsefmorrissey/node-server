
const Lookup = require('../../../../../public/js/utils/object/lookup.js')

const REASSIGNMENT_ERROR = () => new Error('Make a new joint, joints cannot be reassined');

class Joint {
  constructor(malePartCode, femalePartCode, condition, id) {
    let parent, parentId;
    const initialVals = {
      maleOffset: 0, femaleOffset: 0, parentAssemblyId:  undefined,
      malePartCode, femalePartCode, demensionAxis: '', centerAxis: '',
      id
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

    this.clone = (parentOid, malePartCode, femalePartCode, cond, id) => {
      const mpc = malePartCode || this.malePartCode();
      const fpc = femalePartCode || this.femalePartCode();
      parentOid ||= this.parentAssembly() || this.parentAssemblyId();
      const clone = Object.class.new(this, mpc, fpc, cond || condition, id);
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
        this.male(); this.female();
      }
      if (!parent && this.parentAssemblyId()) {
        parent = Lookup.get(this.parentAssemblyId());
        this.male(); this.female();
      }
      return parent;
    }

    this.updatePosition = () => {};

    let male, female;
    this.female = () => {
      if (!female && parent) {
        female = parent.getAssembly(femalePartCode);
      }
      return female;
    }

    this.male = () => {
      if (!male && parent) {
        male = parent.getAssembly(malePartCode);
      }
      return male;
    }

    this.malePartCode = (pc) => {
      if (pc && malePartCode) throw new Error('Create new Joint cannot be reassined');
      if (pc) {
        malePartCode = pc;
        male = undefined;
        this.male();
      }
      return male ? male.partCode(true) : malePartCode;
    }

    this.femalePartCode = (pc) => {
      if (pc) {
        femalePartCode = pc;
        female = undefined;
        this.female();
      }
      return female ? female.partCode(true) : femalePartCode;
    }

    this.getDemensions = () => {
      const malePos = male();
      const femalePos = female();
      // I created a loop but it was harder to understand
      return undefined;
    }
    this.toString = () => `${this.constructor.name}:${this.malePartCode()}->${this.femalePartCode()}`;

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
        const male = joint.male();
        const female = joint.female();
        if (male === undefined) {
          console.warn(`No male found with partCode: '${joint.malePartCode()}'`);
          console.log(joint.male());
          return;
        }
        if (female === undefined) {
          console.warn(`No female found with partCode: '${joint.femalePartCode()}'`);
          console.log(joint.female());
          return;
        }
      try {
        if (male.includeJoints() && female.includeJoints()) {
          const mm = male.toModel();
          if (m.polygons.length > 0 && mm.polygons.length > 0) {
            m = m.subtract(mm);
          }
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
        list.push(j);
      }
      return list;
    }
  }
}

Joint.References = JointReferences;

module.exports = Joint
