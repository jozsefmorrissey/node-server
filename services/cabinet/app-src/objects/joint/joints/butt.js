


const Joint = require('../joint.js');

class Butt extends Joint {
  constructor(dependsSelector, dependentSelector, condition) {
    super(dependsSelector, dependentSelector, condition);
  }
}

Joint.register(Butt);
module.exports = Butt
