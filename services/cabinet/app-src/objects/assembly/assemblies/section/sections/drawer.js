


const SectionProperties = require('../section-properties.js');
const PULL_TYPE = require('../../../../../../globals/CONSTANTS.js').PULL_TYPE;
const DrawerBox = require('../../drawer/drawer-box.js');
const DrawerFront = require('../../drawer/drawer-front.js');
const Assembly = require('../../../assembly.js');

class DrawerSection extends Assembly {
  constructor(sectionProperties) {
    super();
    if (sectionProperties === undefined) return;
    const instance = this;
    this.part = () => false;

    function center() {
      return sectionProperties.coverInfo().center;
    }
    this.part = () => false;

    function dems() {
      const coverInfo = sectionProperties.coverInfo();
      return {
        x: coverInfo.width,
        y: coverInfo.length,
        z: coverInfo.doorThickness
      }
    }

    this.addSubAssembly(new DrawerFront('ff', 'DrawerFront', center, dems, sectionProperties.rotation));



    function getDrawerDepth(depth) {
      if (depth < 3) return 0;
      return (Math.ceil((depth / 2.54 - 1)/2) * 2) * 2.54;
    }

    function drawerCenter(attr) {
      const coverInfo = sectionProperties.coverInfo();
      const drawerDepth = drawerDems().z;
      let center = coverInfo.center;
      center = sectionProperties.offsetPoint(center, 0 , 0, (coverInfo.doorThickness + drawerDepth) / 2);
      return attr ? center[attr] : center;
    }

    function drawerDems(attr) {
      const coverInfo = sectionProperties.coverInfo();
      // TODO add box depth tolerance variable
      dems.z = getDrawerDepth(sectionProperties.innerDepth() - 2.54);
      dems.x = sectionProperties.innerWidth() - 0.9525;
      dems.y = sectionProperties.innerLength() - 2.54;
      return attr ? dems[attr] : dems;
    }

    this.addSubAssembly(new DrawerBox('db', 'Drawer.Box', drawerCenter, drawerDems, sectionProperties.rotation));
  }
}

DrawerSection.abbriviation = 'dws';


module.exports = DrawerSection
