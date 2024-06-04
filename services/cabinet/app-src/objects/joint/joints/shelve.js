
const Joint = require('../joint.js');

class ShelveJoint extends Joint {
  constructor(dependsSelector, dependentSelector, condition, locationId) {
    super(dependsSelector, dependentSelector, condition, locationId);
    this.maleOffset(-0.238125);//3/32
  }
}

Joint.register(ShelveJoint);
module.exports = ShelveJoint;
