


const SectionProperties = require('../section-properties.js');
const PULL_TYPE = require('../../../../../../globals/CONSTANTS.js').PULL_TYPE;
const DrawerBox = require('../../drawer/drawer-box.js');
const DrawerFront = require('../../drawer/drawer-front.js');
const Assembly = require('../../../assembly.js');
const Polygon3D = require('../../../../../three-d/objects/polygon.js');
const GovernedBySection = require('../governed-by-section');
const DrawerFrontGoverned = GovernedBySection.DrawerFront;
const DrawerBoxGoverned = GovernedBySection.DrawerBox;

class DrawerSection extends GovernedBySection {
  constructor(front, box) {
    super('d');
    const instance = this;
    const sectionProps = () => instance.parentAssembly();
    this.part = () => false;

    this.front = () => front;
    this.pull = (i) => front.pull(i);
    this.box = () => box;

    this.initialize = () => {
      if (!front) front = new DrawerFrontGoverned('df', 'DrawerFront');
      front.partName = () => `${sectionProps().partName()}-df`;
      this.addSubAssembly(front);
      if (!box) box = new DrawerBoxGoverned('db', 'Drawer.Box');
      box.partName = () => `${sectionProps().partName()}-db`;
      this.addSubAssembly(box);
    }
  }
}

DrawerSection.fromJson = (json) => {
  const drawerFront = Object.fromJson(json.subassemblies.df);
  const drawerBox = Object.fromJson(json.subassemblies.db);
  return new DrawerSection(drawerFront, drawerBox);
}

DrawerSection.abbriviation = 'dws';
SectionProperties.addSection(DrawerSection);


module.exports = DrawerSection
