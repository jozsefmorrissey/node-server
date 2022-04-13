


const Assembly = require('../../assembly.js');

class DrawerBox extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
  }
}

DrawerBox.abbriviation = 'db';


module.exports = DrawerBox
