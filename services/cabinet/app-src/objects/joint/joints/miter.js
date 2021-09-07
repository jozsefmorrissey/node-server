


const Joint = require('../joint.js');

class Miter extends Joint {
  constructor(joinStr) {
    super(joinStr);
  }
}

Joint.register(Miter);
module.exports = Miter




