


const Assembly = require('../../assembly.js');

class DrawerBox extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
  }
}

DrawerBox.abbriviation = 'db';

Assembly.register(DrawerBox);
module.exports = DrawerBox



