


const Joint = require('../joint.js');

class Butt extends Joint {
  constructor(malePartCode, femalePartCode) {
    super(malePartCode, femalePartCode);
  }
}

Joint.register(Butt);
module.exports = Butt
