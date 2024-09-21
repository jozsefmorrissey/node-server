
const Joint = require('../joint.js');

class Dado extends Joint {
  constructor(dependsSelector, dependentSelector, condition, locationId) {
    super(dependsSelector, dependentSelector, condition, locationId);

    this.eval.maleOffset = () => {
      const mo = this.maleOffset();
      const evaluator = this.evaluator();
      return evaluator ? evaluator(mo || 'ddd') : mo || 'ddd';
    }
  }
}

Object.class.register(Dado);
Joint.register(Dado);
module.exports = Dado
