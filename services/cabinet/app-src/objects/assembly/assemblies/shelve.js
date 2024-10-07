
const Panel = require('./panel');
const ShelfPegs = require('./hardware/shelf-pegs.js');

class Shelve extends Panel {
  constructor(...args) {
    super(...args);
    this.category('Shelve');
    this.jointSettings.female(false);
    this.hardware.push(new ShelfPegs());
    this.hardware[0].parentAssembly(this);
  }
}

module.exports = Shelve;
