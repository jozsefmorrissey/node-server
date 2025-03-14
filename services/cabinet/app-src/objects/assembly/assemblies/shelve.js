
const Panel = require('./panel');
const ShelfPegs = require('./hardware/shelf-pegs.js');

class Shelve extends Panel {
  constructor(...args) {
    super(...args);
    this.category('Shelve');
    this.jointSettings.female(false);
    this.hardware.push(new ShelfPegs());
    this.hardware[0].parentAssembly(this);

    this.hash = () => Math.hash(...this.hardware.map(g => g.hash()));
  }
}

module.exports = Shelve;
