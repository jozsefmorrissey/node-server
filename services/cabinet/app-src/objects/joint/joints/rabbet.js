


const Joint = require('../joint.js');

class Rabbet extends Joint {
  constructor(joinStr, defaultDepth, axis, centerOffset) {
    super(joinStr);
  }
}

Object.class.register(Rabbet);
Joint.register(Rabbet);
module.exports = Rabbet
