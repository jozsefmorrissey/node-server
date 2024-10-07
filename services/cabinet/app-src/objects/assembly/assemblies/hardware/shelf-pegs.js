
const Assembly = require('../../assembly.js');

class ShelfPeg extends Assembly {
  constructor(partCode) {
    super(partCode);
    this.demensions = (parentInfo) => {
      return {x:1,y:1,z:1}
    }
  }
}


class ShelfPegs extends Assembly {
  constructor() {
    super();
    const instance = this;
    let pegCount = 4;

    function setPegCount() {
      instance.hardware = Array.fill(pegCount, () => new ShelfPeg('shpg'));
      instance.hardware.forEach(h => h.parentAssembly(instance));
    }


    this.demensions = (parentInfo) => {
      setPegCount();
    }

    this.composite = () => true;
  }
}

module.exports = ShelfPegs;
