


const Assembly = require('../../assembly.js');
const drawerBox = require('../../../../three-d/models/drawer-box.js');

class DrawerBox extends Assembly {
  constructor(partCode, partName, getFrontPoly, getNormal, getDepth) {
    super(partCode, partName);

    this.toModel = () => {
      const props = this.getRoot().group().propertyConfig('DrawerBox');
      return drawerBox(getFrontPoly(), getNormal(), getDepth(), props);
    }
  }
}

DrawerBox.abbriviation = 'db';


module.exports = DrawerBox
