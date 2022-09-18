


const OpeningCoverSection = require('../open-cover.js');
const Section = require('../../../../section.js');
const PULL_TYPE = require('../../../../../../../../../globals/CONSTANTS.js').PULL_TYPE;
const DrawerBox = require('../../../../../drawer/drawer-box.js');
const DrawerFront = require('../../../../../drawer/drawer-front.js');
const Assembly = require('../../../../../../assembly.js');

class DrawerSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(partCode, 'Drawer.Section', divideProps, parent, PULL_TYPE.DRAWER);
    if (divideProps === undefined) return;
    const instance = this;

    function getDrawerDepth(depth) {
      if (depth < 3) return 0;
      return (Math.ceil((depth / 2.54 - 1)/2) * 2) * 2.54;
    }

    function drawerCenter(attr) {
      const props = divideProps();
      const dems = drawerDems();
      const center = instance.center();
      center.z = props.position.front + (dems.z) / 2 - 1/8;
      return attr ? center[attr] : center;
    }

    function drawerDems(attr) {
      const props = divideProps();
      const dems = instance.innerSize()
      // TODO add box depth tolerance variable
      dems.z = getDrawerDepth(props.depth - 2.54);
      dems.x = dems.x - 0.9525;
      dems.y = dems.y - 2.54;
      return attr ? dems[attr] : dems;
    }

    this.addSubAssembly(new DrawerBox('db', 'Drawer.Box', drawerCenter, drawerDems));
    this.addSubAssembly(new DrawerFront('df', 'Drawer.Front', this.coverCenter, this.coverDems, '', this));
  }
}

DrawerSection.abbriviation = 'dws';


module.exports = DrawerSection
