


const Joint = require('../joint.js');

class Butt extends Joint {
  constructor(dependsSelector, dependentSelector, condition, locationId) {
    super(dependsSelector, dependentSelector, condition, locationId);
  }
}

Object.class.register(Butt);
Joint.register(Butt);
module.exports = Butt
