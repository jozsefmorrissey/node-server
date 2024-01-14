


const Assembly = require('../../assembly.js');
const drawerBox = require('../../../../three-d/models/drawer-box.js');

class DrawerBox extends Assembly {
  constructor(partCode, partName, getFrontPoly, getNormal, getDepth) {
    super(partCode, partName);
    this.part = () => this.depth() > 5.5*2.54;
  }
}

DrawerBox.abbriviation = 'db';


module.exports = DrawerBox
