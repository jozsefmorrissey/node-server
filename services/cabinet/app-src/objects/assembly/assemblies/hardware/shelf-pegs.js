
const Assembly = require('../../assembly.js');

class ShelfPeg extends Assembly {
  constructor(partCode) {
    super(partCode);
    this.demensions = () => {
      return {x:1,y:1,z:1}
    }
    this.hash = () => Object.hash(this.demensions());
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


    this.demensions = () => {
      setPegCount();
    }

    this.composite = () => true;
    this.hash = () => Math.hash(...this.hardware.map(g => g.hash()));
  }
}

module.exports = ShelfPegs;
