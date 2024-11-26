


const Assembly = require('../assembly.js');

class Frame extends Assembly {
  constructor(partCode, partName, config) {
    super(partCode, partName, config);
  }
}

Frame.property('manuallyConfigurable', true, false, false, false);

module.exports = Frame
