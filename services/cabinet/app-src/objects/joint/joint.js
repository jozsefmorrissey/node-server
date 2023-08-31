
const Lookup = require('../../../../../public/js/utils/object/lookup.js')


class Joint {
  constructor(malePartCode, femalePartCode, condition) {
    let parentAssembly;
    const initialVals = {
      maleOffset: 0, femaleOffset: 0, parentAssemblyId:  undefined,
      malePartCode, femalePartCode, demensionAxis: '', centerAxis: ''
    }
    Object.getSet(this, initialVals);

    this.apply = () => (typeof condition === 'function') ? condition(this) : true;

    this.parentAssembly = () => {
      if (!parentAssembly && this.parentAssemblyId()) {
        parentAssembly = Lookup.get(this.parentAssemblyId());
        this.parentAssemblyId = () => parentAssembly.id();
      }
      if (parentAssembly === undefined) {
        console.log(malePartCode, femalePartCode, parentAssembly);
      }
      return parentAssembly;
    }

    this.updatePosition = () => {};

    this.getFemale = () => this.parentAssembly().getAssembly(this.femalePartCode());
    this.getMale = () => this.parentAssembly().getAssembly(this.malePartCode());

    this.getDemensions = () => {
      const malePos = getMale();
      const femalePos = getFemale();
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
  try {
    let m = model; // preventCouruption
    joints.forEach((joint) => {
      if (joint.apply()) {
        const male = joint.getMale();
        if (male === undefined) {
          console.warn(`No male found with partCode: '${joint.malePartCode()}'`);
          return;
        }
        const mm = male.toModel();
        if (m.polygons.length > 0 && mm.polygons.length > 0) {
          m = m.subtract(mm);
        }
      }
    });
    return m;
  } catch (e) {
    console.error('Most likely caused by a circular joint reference',e);
    return model;
  }
}
module.exports = Joint
