


const Assembly = require('../../assembly.js');
const Handle = require('../hardware/pull.js');

class DrawerFront extends Assembly {
  constructor(partCode, partName, centerConfig, demensionConfig, rotationConfig, parent) {
    super(partCode, partName, centerConfig, demensionConfig, rotationConfig);
    this.setParentAssembly(parent);
    const instance = this;
    let pulls = [new Handle(undefined, 'Drawer.Handle', this, Handle.location.CENTER, index, 1)];
    if (demensionConfig === undefined) return;
    let handleCount = 1;

    function pullCount() {
      if (instance.demensionConfig().x < 55.88) return 1;
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
    // if (demensionConfig !== undefined)this.updatePosition();
  }
}

DrawerFront.abbriviation = 'df';


module.exports = DrawerFront
