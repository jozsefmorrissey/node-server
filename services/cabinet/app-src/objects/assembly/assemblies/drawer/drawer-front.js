


const Assembly = require('../../assembly.js');
const Handle = require('../hardware/pull.js');

class DrawerFront extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr, parent) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
    this.setParentAssembly(parent);
    const instance = this;
    let pulls = [new Handle(undefined, 'Drawer.Handle', this, Handle.location.CENTER, index, 1)];
    if (demensionStr === undefined) return;
    let handleCount = 1;

    function pullCount() {
      if (instance.demensionStr().x < 55.88) return 1;
      return 2;
    }

    this.children = () => this.updateHandles();

    this.updateHandles = (count) => {
      count = count || pullCount();
      pulls.splice(count);
      for (let index = 0; index < count; index += 1) {
        if (index === pulls.length) {
          pulls.push(new Handle(undefined, 'Drawer.Handle', this, Handle.location.CENTER, index, count));
        } else {
          pulls[index].count(count);
        }
      }
      return pulls;
    };
    // if (demensionStr !== undefined)this.updatePosition();
  }
}

DrawerFront.abbriviation = 'df';


module.exports = DrawerFront
