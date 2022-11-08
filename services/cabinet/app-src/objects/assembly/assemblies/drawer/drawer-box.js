


const Assembly = require('../../assembly.js');

class DrawerBox extends Assembly {
  constructor(partCode, partName, centerConfig, demensionConfig, rotationConfig) {
    super(partCode, partName, centerConfig, demensionConfig, rotationConfig);
  }
}

DrawerBox.abbriviation = 'db';


module.exports = DrawerBox
