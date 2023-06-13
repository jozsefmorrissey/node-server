
const Lookup = require('../lookup.js');

class Style extends Lookup {
  constructor (name, cost) {
    super(name);
    Object.getSet(this, 'cost');
    this.cost(cost);
  }
}

module.exports = Style;
