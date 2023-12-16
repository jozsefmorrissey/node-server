


const Joint = require('../joint.js');

class Butt extends Joint {
  constructor(maleJointSelector, femaleJointSelector, condition) {
    super(maleJointSelector, femaleJointSelector, condition);
  }
}

Joint.register(Butt);
module.exports = Butt
