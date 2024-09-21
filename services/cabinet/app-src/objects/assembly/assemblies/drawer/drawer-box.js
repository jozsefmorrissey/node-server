


const Assembly = require('../../assembly.js');

class DrawerBox extends Assembly {
  constructor(partCode, partName, getFrontPoly, getNormal, getDepth) {
    super(partCode, partName);
    this.outsourced(true);
    this.jointSettings.sliceAtOpening(false);
  }
}

DrawerBox.abbriviation = 'db';


module.exports = DrawerBox
