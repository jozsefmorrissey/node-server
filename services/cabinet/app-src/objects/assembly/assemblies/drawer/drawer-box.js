


const Assembly = require('../../assembly.js');
const drawerBox = require('../../../../three-d/models/drawer-box.js');

class DrawerBox extends Assembly {
  constructor(partCode, partName, getFrontPoly, getDepth) {
    super(partCode, partName);

    this.toModel = () => drawerBox(getFrontPoly(), getDepth());
  }
}

DrawerBox.abbriviation = 'db';


module.exports = DrawerBox
