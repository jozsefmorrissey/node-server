
const Lookup = require('../lookup.js');

class PerBoxCost extends Lookup {
  constructor(name, cost) {
    super(name);
    this.getSet('cost');
    this.cost(cost);
  }
}

module.exports = PerBoxCost;
