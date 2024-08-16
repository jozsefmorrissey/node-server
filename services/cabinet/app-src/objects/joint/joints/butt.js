


const Joint = require('../joint.js');

class Butt extends Joint {
  constructor(dependsSelector, dependentSelector, condition) {
    super(dependsSelector, dependentSelector, condition);
  }
}

Object.class.register(Butt);
Joint.register(Butt);
module.exports = Butt
