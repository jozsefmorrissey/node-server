


const Joint = require('../joint.js');

class Butt extends Joint {
  constructor(joinStr) {
    super(joinStr);
  }
}

Joint.register(Butt);
module.exports = Butt




