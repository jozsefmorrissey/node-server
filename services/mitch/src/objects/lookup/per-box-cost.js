
const Lookup = require('../lookup.js');

class PerBoxCost extends Lookup {
  constructor(name, cost) {
    super(name);
    Object.getSet(this, 'cost');
    this.cost(cost);
  }
}

module.exports = PerBoxCost;
