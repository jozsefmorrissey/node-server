
const Lookup = require('../lookup.js');

class BoxMaterial extends Lookup {
  constructor (name, multiplier, tallMultiplier) {
    super(name);
    this.getSet('multiplier', 'tallMultiplier');
    this.multiplier(multiplier);
    this.tallMultiplier(tallMultiplier);
  }
}

module.exports = BoxMaterial;
