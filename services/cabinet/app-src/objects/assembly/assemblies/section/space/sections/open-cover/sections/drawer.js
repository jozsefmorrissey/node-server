


const OpeningCoverSection = require('../open-cover.js');
const Section = require('../../../../section.js');
const PULL_TYPE = require('../../../../../../../../../globals/CONSTANTS.js').PULL_TYPE;
const DrawerBox = require('../../../../../drawer/drawer-box.js');
const DrawerFront = require('../../../../../drawer/drawer-front.js');
const Assembly = require('../../../../../../assembly.js');

class DrawerSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(DrawerSection.filePath('drawer'), partCode, 'Drawer.Section', divideProps, PULL_TYPE.DRAWER);
    if (divideProps === undefined) return;
    const instance = this;

    function getDrawerDepth(depth) {
      if (depth < 3) return 0;
      return Math.ceil((depth - 1)/2) * 2;
    }

    function drawerCenter(attr) {
      const props = divideProps();
      const dems = drawerDems();
      const center = instance.center();
      center.z += (dems.z - props.borders.top.position().demension('z')) / 2 - 1/8;
      return attr ? center[attr] : center;
    }

    function drawerDems(attr) {
      const props = divideProps();
      const dems = instance.innerSize()
      dems.z = getDrawerDepth(props.depth);
      dems.x = dems.x - 1/2;
      dems.y = dems.y - 1/2;
      return attr ? dems[attr] : dems;
    }

    this.addSubAssembly(new DrawerBox('db', 'Drawer.Box', drawerCenter, drawerDems));
    this.addSubAssembly(new DrawerFront('df', 'Drawer.Front', this.coverCenter, this.coverDems, '', this));
  }
}

DrawerSection.abbriviation = 'dws';

Assembly.register(DrawerSection);
module.exports = DrawerSection
