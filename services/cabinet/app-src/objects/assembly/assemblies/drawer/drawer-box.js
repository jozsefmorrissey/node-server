


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

    this.hash = () => Math.hash(...this.hardware.map(g => g.hash()));
  }
}

DrawerBox.property('manuallyConfigurable', true, false, false, false);


module.exports = DrawerBox
