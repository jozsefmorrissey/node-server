
const Dependency = require('../dependency');
const BiPolygon = require('../../three-d/objects/bi-polygon.js');
const Polygon3D = require('../../three-d/objects/polygon.js');

class Joint extends Dependency {
  constructor(dependsSelector, dependentSelector, condition, locationId, priority) {
    super(dependsSelector, dependentSelector, condition, locationId, priority);
    priority ||= 0;
    const initialVals = {
      maleOffset: 0, femaleOffset: 0, demensionAxis: '', centerAxis: '',
      fullLength: false, priority,
    }
    const parentClone = this.clone;

    Object.getSet(this, initialVals);
    this.clone = (dependsSelector, dependentSelector, cond, locId) => {
      const clone = parentClone(dependsSelector, dependentSelector, cond, locId);
      clone.maleOffset(this.maleOffset());
      clone.femaleOffset(this.femaleOffset());
      clone.demensionAxis(this.demensionAxis());
      clone.centerAxis(this.centerAxis());
      clone.priority(this.priority());
      clone.fullLength(this.fullLength());
      return clone;
    }

    this.updatePosition = () => {};

    this.dependsSelector = this.dependsSelector;
    this.dependentSelector = this.dependentSelector;

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

Joint.fromJson = (json) => {
  const joint = new (Object.class.get(json._TYPE))(json.dependsSelector, json.dependentSelector);
  joint.centerAxis(json.centerAxis);
  joint.demensionAxis(json.demensionAxis);
  joint.maleOffset(json.maleOffset);
  joint.femaleOffset(json.femaleOffset);
  return joint;
}




module.exports = Joint
