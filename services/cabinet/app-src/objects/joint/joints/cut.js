


const Joint = require('../joint.js');

class Cut extends Joint {
  constructor(dependsSelector, dependentSelector, condition, locationId) {
    super(dependsSelector, dependentSelector, condition, locationId);
  }
}

Object.class.register(Cut);
Joint.register(Cut);
module.exports = Cut
