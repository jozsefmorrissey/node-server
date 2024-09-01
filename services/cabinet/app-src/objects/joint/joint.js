
const Dependency = require('../dependency');
const BiPolygon = require('../../three-d/objects/bi-polygon.js');
const Polygon3D = require('../../three-d/objects/polygon.js');

class Joint extends Dependency {
  constructor(dependsSelector, dependentSelector, condition, locationId, priority) {
    super(dependsSelector, dependentSelector, condition, locationId, priority);
    priority ||= 0;
    let maleOffset, fullLength;

    this.maleOffset = (val) => val === undefined ? maleOffset : (maleOffset = val);
    this.fullLength = (val) => val === undefined ? fullLength : (fullLength = val);
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

Object.class.register(Joint, 'maleOffset', 'fullLength', 'priority', 'evaluator');




module.exports = Joint
