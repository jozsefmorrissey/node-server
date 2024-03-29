
const Panel = require('./panel');

class Shelve extends Panel {
  constructor(...args) {
    super(...args);
    this.category = 'Shelve';
  }
}

module.exports = Shelve
