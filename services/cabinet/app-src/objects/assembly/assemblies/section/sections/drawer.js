


const SectionProperties = require('../section-properties.js');
const DrawerBox = require('../../drawer/drawer-box.js');
const DrawerFront = require('../../drawer/drawer-front.js');
const Assembly = require('../../../assembly.js');

class DrawerSection extends Assembly {
  constructor(front, box) {
    super('d');
    const instance = this;
    const sectionProps = () => instance.parentAssembly();
    this.part = () => false;

    this.front = () => front;
    this.pull = (i) => front.pull(i);
    this.box = () => box;

    this.initialize = () => {
      if (!front) front = new DrawerFront('df', 'DrawerFront');
      front.modelingMethod('Solid');
      front.partName = () => `${sectionProps().partName()}-df`;
      this.addSubAssembly(front);
      if (!box) box = new DrawerBox('db', 'Drawer.Box');
      box.modelingMethod('Section');
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
