
const Lookup = require('../lookup.js');

class Style extends Lookup {
  constructor (name, cost) {
    super(name);
    this.getSet('cost');
    this.cost(cost);
  }
}

module.exports = Style;
