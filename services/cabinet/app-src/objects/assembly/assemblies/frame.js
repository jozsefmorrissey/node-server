


const Assembly = require('../assembly.js');

class Frame extends Assembly {
  constructor(partCode, partName, config) {
    super(partCode, partName, config);
  }
}

Frame.abbriviation = 'fr';


module.exports = Frame
