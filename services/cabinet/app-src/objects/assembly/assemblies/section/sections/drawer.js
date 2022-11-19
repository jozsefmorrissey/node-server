


const SectionProperties = require('../section-properties.js');
const PULL_TYPE = require('../../../../../../globals/CONSTANTS.js').PULL_TYPE;
const DrawerBox = require('../../drawer/drawer-box.js');
const DrawerFront = require('../../drawer/drawer-front.js');
const Assembly = require('../../../assembly.js');
const Polygon3D = require('../../../../../three-d/objects/polygon.js');

class DrawerSection extends Assembly {
  constructor(sectionProperties) {
    super();
    if (sectionProperties === undefined) return;
    const instance = this;
    this.part = () => false;

    function getFrontBiPolygon () {
      return sectionProperties.coverInfo().biPolygon;
    }

    const front = new DrawerFront('ff', 'DrawerFront', getFrontBiPolygon);
    this.front = () => door;
    this.pull = (i) => front.pull(i);
    this.addSubAssembly(front);



    function getDrawerDepth() {
      const depth = sectionProperties.innerDepth();
      if (depth < 3) return 0;
      return (Math.floor(((depth - 2.54) / 2.54)/2) * 2) * 2.54;
    }



    function getFrontPoly() {
      const innerPoly = new Polygon3D(sectionProperties.coordinates().inner);
      const coverInfo = sectionProperties.coverInfo();
      const biPoly = coverInfo.biPolygon;
      const depth = getDrawerDepth(sectionProperties.innerDepth);
      const offsetVect = biPoly.front().normal().scale(coverInfo.frontOffset);
      return innerPoly.translate(offsetVect);
    }

    const drawerBox = new DrawerBox('db', 'Drawer.Box', getFrontPoly, getDrawerDepth);
    this.box = () => drawerBox;
    this.addSubAssembly(drawerBox);
  }
}

DrawerSection.abbriviation = 'dws';


module.exports = DrawerSection
