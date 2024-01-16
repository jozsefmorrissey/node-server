
const Lookup = require('../../../../../public/js/utils/object/lookup.js');
const BiPolygon = require('../../three-d/objects/bi-polygon.js');
const Polygon3D = require('../../three-d/objects/polygon.js');
// const Assembly = require('../assembly/assembly.js');

function isMatch(partCodeOlocationCodeOassemblyOregexOfunc, assem) {
  let pclcarf = partCodeOlocationCodeOassemblyOregexOfunc;
  if (pclcarf instanceof Function) return pclcarf(assem) === true;
  if ((typeof pclcarf) === 'string') pclcarf = new RegExp(`^${pclcarf}(:.*|)$`);
  if (pclcarf instanceof RegExp) {
    return null !== (assem.partCode().match(pclcarf) || assem.locationCode().match(pclcarf));
  }
  return assem === pclcarf;
}

const matchFilter = (pclcarf, filter) => {
  const runFilter = filter instanceof Function;
  return (a) => {
    return a.constructor.joinable && a.includeJoints() && isMatch(pclcarf, a) && (!runFilter || filter(a));
  }
}

const REASSIGNMENT_ERROR = () => new Error('Make a new joint, joints cannot be reassined');

class Joint extends Lookup {
  constructor(maleJointSelector, femaleJointSelector, condition, locationId) {
    super();
    const initialVals = {
      maleOffset: 0, femaleOffset: 0,
      maleJointSelector, femaleJointSelector, demensionAxis: '', centerAxis: '',
      locationId, fullLength: false,
    }
    Object.getSet(this, initialVals);

    this.apply = () => (typeof condition === 'function') ? condition(this) : true;



    this.clone = (maleJointSelector, femaleJointSelector, cond, locId) => {
      const mpc = maleJointSelector || this.maleJointSelector();
      const fpc = femaleJointSelector || this.femaleJointSelector();
      locId ||= locationId;
      const clone = Object.class.new(this, mpc, fpc, cond || condition, locId);
      clone.maleOffset(this.maleOffset());
      clone.femaleOffset(this.femaleOffset());
      clone.demensionAxis(this.demensionAxis());
      clone.centerAxis(this.centerAxis());
      clone.fullLength(this.fullLength());
      return clone;
    }

    this.updatePosition = () => {};

    this.maleJointSelector = (pc) => {
      if (pc && maleJointSelector) throw new Error('Create new Joint cannot be reassined');
      if (pc) {
        maleJointSelector = pc;
      }
      return maleJointSelector;
    }
    this.isMale = (assem) => isMatch(this.maleJointSelector(), assem);
    this.isFemale = (assem) => isMatch(this.femaleJointSelector(), assem);

    this.femaleJointSelector = (pc) => {
      if (pc && femaleJointSelector) throw new Error('Create new Joint cannot be reassined');
      if (pc) {
        femaleJointSelector = pc;
      }
      return femaleJointSelector;
    }


    this.discriptor = () => `${this.constructor.name}(${locationId}):${this.maleJointSelector()}->${this.femaleJointSelector()}`;
    this.toString = this.discriptor;
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

Joint.fromJson = (json) => {
  const joint = new (Object.class.get(json._TYPE))(json.maleJointSelector, json.femaleJointSelector);
  joint.centerAxis(json.centerAxis);
  joint.demensionAxis(json.demensionAxis);
  joint.maleOffset(json.maleOffset);
  joint.femaleOffset(json.femaleOffset);
  return joint;
}




module.exports = Joint
