


const Assembly = require('../../assembly.js');
const Guides = require('./guides');
const Dependency = require('../../../dependency.js');

class DrawerBox extends Assembly {
  constructor(partCode, partName, getFrontPoly, getNormal, getDepth) {
    super(partCode, partName);
    this.outsourced(true);
    this.jointSettings.sliceAtOpening(false);

    const guides = new Guides('gs');
    this.hardware.push(guides);
    guides.parentAssembly(this);
  }
}

module.exports = DrawerBox
