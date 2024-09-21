
const Joint = require('../joint.js');

class PlayJoint extends Joint {
  constructor(dependsSelector, dependentSelector, condition, locationId) {
    super(dependsSelector, dependentSelector, condition, locationId);
    this.maleOffset(-0.238125);//3/32
  }
}

Object.class.register(PlayJoint);
Joint.register(PlayJoint);
module.exports = PlayJoint;
