


const Assembly = require('../../assembly.js');
const drawerBox = require('../../../../three-d/models/drawer-box.js');

class DrawerBox extends Assembly {
  constructor(partCode, partName, getFrontPoly, getNormal, getDepth) {
    super(partCode, partName);

    this.normal = () => this.parentAssembly().getNormal(partCode);
    this.depth = () => this.parentAssembly().drawerDepth();
    this.biPolygon = () => this.parentAssembly().getBiPolygon(partCode);
    this.part = () => this.depth() > 8.5*2.54;

    this.toModel = () => {
      const props = this.getRoot().group().propertyConfig('DrawerBox');
      return drawerBox(this.biPolygon(), this.normal(), this.depth(), props);
    }
  }
}

DrawerBox.abbriviation = 'db';


module.exports = DrawerBox
