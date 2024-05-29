


const Assembly = require('../../assembly.js');

class DrawerBox extends Assembly {
  constructor(partCode, partName, getFrontPoly, getNormal, getDepth) {
    super(partCode, partName);
    this.sliceAtOpening(false);
  }
}

DrawerBox.abbriviation = 'db';


module.exports = DrawerBox
