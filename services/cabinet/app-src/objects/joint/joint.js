
const Lookup = require('../../../../../public/js/utils/object/lookup.js');
const BiPolygon = require('../../three-d/objects/bi-polygon.js');
const Polygon3D = require('../../three-d/objects/polygon.js');
// const Assembly = require('../assembly/assembly.js');

const REASSIGNMENT_ERROR = () => new Error('Make a new joint, joints cannot be reassined');

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

    this.toString = () => `${this.constructor.name}(${locationId}):${this.maleJointSelector()}->${this.femaleJointSelector()}`;
  }
}

class DependentOn extends Joint {constructor(...args){super(...args);}}

Joint.DependentOn = DependentOn;
Joint.regex = /([a-z0-9-_\.]{1,})->([a-z0-9-_\.]{1,})/;

Joint.classes = {};
Joint.register = (clazz) => {
  new clazz();
  Joint.classes[clazz.prototype.constructor.name] = clazz;
}
Joint.new = function (id, json) {
  return new Joint.classes[id]().fromJson(json);
}




module.exports = Joint
