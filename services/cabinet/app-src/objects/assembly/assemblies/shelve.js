
const Panel = require('./panel');

class Shelve extends Panel {
  constructor(...args) {
    super(...args);
    this.category('Shelve');
    this.jointSettings.female(false);
  }
}

module.exports = Shelve
