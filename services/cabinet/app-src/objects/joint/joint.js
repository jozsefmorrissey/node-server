
const Dependency = require('../dependency');
const {BiPolygon, Polygon3D} = require('../../../../../public/js/utils/canvas/three-d/lib.js');

class Joint extends Dependency {
  constructor(dependsSelector, dependentSelector, condition, locationId, priority) {
    super(dependsSelector, dependentSelector, condition, locationId, priority);
    priority ||= 0;
    let maleOffset;
    let fullMale = true;
    let fullFemale = false;
    let autoExtend = true;

    this.maleOffset = (val) => val === undefined ? maleOffset : (maleOffset = val);
    this.full = {
      male: (val) => val === undefined ? fullMale : (fullMale = val),
      female: (val) => val === undefined ? fullFemale : (fullFemale = val)
    }
    this.autoExtend = (trueOfalse) => Boolean.is(trueOfalse) ? (autoExtend = trueOfalse) :  autoExtend;
    this.priority = (val) => val === undefined ? priority : (priority = val);
    const parentClone = this.clone;

    this.sibling = (dependsSelector, dependentSelector, cond, locId) => {
      const clone = this.constructor.clone(this);
      clone.selector.depends(dependsSelector);
      clone.selector.dependent(dependentSelector);
      clone.condition = cond || this.condition;
      clone.maleOffset(this.maleOffset());
      clone.evaluator(this.evaluator());
      clone.locationId(locId || this.locationId());
      return clone;
    }

    let _evaluator;
    this.evaluator = (evaluator) =>
      evaluator ? (_evaluator = evaluator) : _evaluator;
    this.eval = {};
    this.eval.maleOffset = () =>
      _evaluator ? _evaluator(this.maleOffset()) : this.maleOffset();
    this.isMale = this.dependsOn;
    this.isFemale = this.isDependent;
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

Object.class.register(Joint, 'maleOffset', 'priority', 'evaluator', 'full.male',
  'full.female', 'autoExtend');




module.exports = Joint
