
const Dado = require('../joint.js');

class Shelve extends Joint {
  constructor(dependsSelector, dependentSelector, condition, locationId) {
    super(dependsSelector, dependentSelector, condition, locationId);
  }
}

Joint.register(Dado);
module.exports = Dado
