


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

    if (!front) front = new DrawerFront('df', 'Solid');
    this.addSubAssembly(front);
    if (!box) box = new DrawerBox('db', 'Section');
    this.addSubAssembly(box);
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
