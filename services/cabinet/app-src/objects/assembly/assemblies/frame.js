


const Assembly = require('../assembly.js');

class Frame extends Assembly {
  constructor(partCode, partName, config) {
    super(partCode, partName, config);

    this.hash = () => config ? Object.hash(this.config) : 0;
  }
}

Frame.property('manuallyConfigurable', true, false, false, false);

module.exports = Frame
