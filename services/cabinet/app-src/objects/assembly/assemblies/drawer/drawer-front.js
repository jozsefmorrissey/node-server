


const Assembly = require('../../assembly.js');
const Handle = require('../hardware/pull.js');

class DrawerFront extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr, parent) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
    this.setParentAssembly(parent);
    const instance = this;
    let pulls;
    if (demensionStr === undefined) return;

    function pullCount(dems) {
      if (dems.x < 55.88) return 1;
      return 2;
    }

    this.demensionStr = (attr) => {
      const dems = demensionStr();
      return dems;
    };

    this.children = () => this.updateHandles();

    this.updateHandles = (dems, count) => {
      count = count || pullCount(this.demensionStr());
      pulls = [];
      for (let index = 0; index < count; index += 1) {
        pulls.push(new Handle(`${partCode}-p-${index}`, 'Drawer.Handle', this, Handle.location.CENTER, index, count));
      }
      return pulls;
    };
    if (demensionStr !== undefined)this.updatePosition();
  }
}

DrawerFront.abbriviation = 'df';


module.exports = DrawerFront
