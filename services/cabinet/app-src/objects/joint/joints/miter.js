


const Joint = require('../joint.js');

class Miter extends Joint {
  constructor(dependsSelector, dependentSelector, condition, locationId, priority) {
    super(dependsSelector, dependentSelector, condition, locationId, priority);
  }
}

Object.class.register(Miter);
Joint.register(Miter);
module.exports = Miter
