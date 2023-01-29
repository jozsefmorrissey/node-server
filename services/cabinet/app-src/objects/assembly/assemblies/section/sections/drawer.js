


const SectionProperties = require('../section-properties.js');
const PULL_TYPE = require('../../../../../../globals/CONSTANTS.js').PULL_TYPE;
const DrawerBox = require('../../drawer/drawer-box.js');
const DrawerFront = require('../../drawer/drawer-front.js');
const Assembly = require('../../../assembly.js');
const Polygon3D = require('../../../../../three-d/objects/polygon.js');

class DrawerSection extends Assembly {
  constructor(front, box) {
    super();
    const instance = this;
    const sectionProps = () => instance.parentAssembly();
    this.part = () => false;

    function getFrontBiPolygon () {
      return sectionProps().coverInfo().biPolygon;
    }
    this.getBiPolygon = getFrontBiPolygon;

    // TODO: change ff to df.
    if (!front) front = new DrawerFront('ff', 'DrawerFront');
    front.partName = () => `${sectionProps().partName()}-df`;
    this.front = () => door;
    this.pull = (i) => front.pull(i);
    this.addSubAssembly(front);



    function getDrawerDepth() {
      const depth = sectionProps().innerDepth();
      if (depth < 3) return 0;
      return (Math.floor(((depth - 2.54) / 2.54)/2) * 2) * 2.54;
    }
    this.drawerDepth = getDrawerDepth;

    this.getNormal = () => front.biPolygon().normal();

    function getFrontPoly() {
      const propConfig = sectionProps().getRoot().group().propertyConfig;
      const props = propConfig('Guides');
      const innerPoly = new Polygon3D(sectionProps().coordinates().inner);
      const coverInfo = sectionProps().coverInfo();
      const biPoly = front.biPolygon();
      const depth = getDrawerDepth(sectionProps().innerDepth);
      const offsetVect = biPoly.normal().scale(coverInfo.backOffset);
      const sideOffset = props.dbsos.value();
      const topOffset = props.dbtos.value();
      const bottomOffset = props.dbbos.value();
      innerPoly.offset(sideOffset/2, sideOffset/2, topOffset, bottomOffset);
      return innerPoly.translate(offsetVect);
    }

    this.getBiPolygon = (partCode) => {
      switch (partCode) {
        case 'db': return getFrontPoly();
        case 'ff': return getFrontBiPolygon();
        default: throw new Error(`PartCode: '${partCode}' biPolygon has not been defined for this object`);
      }
    }

    if (!box) box = new DrawerBox('db', 'Drawer.Box');
    box.partName = () => `${sectionProps().partName()}-db`;
    this.box = () => box;
    this.addSubAssembly(box);
  }
}

DrawerSection.fromJson = (json) => {
  const drawerFront = Object.fromJson(json.subassemblies.ff);
  const drawerBox = Object.fromJson(json.subassemblies.df);
  return new DrawerSection(drawerFront, drawerBox);
}

DrawerSection.abbriviation = 'dws';
SectionProperties.addSection(DrawerSection);


module.exports = DrawerSection
