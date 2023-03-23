


const Joint = require('../joint.js');

class Butt extends Joint {
  constructor(malePartCode, femalePartCode, condition) {
    super(malePartCode, femalePartCode, condition);
  }
}

Joint.register(Butt);
module.exports = Butt
