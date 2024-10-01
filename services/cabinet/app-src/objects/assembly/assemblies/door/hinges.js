


const Assembly = require('../../assembly.js');


class Hinge extends Assembly {
  constructor(partCode) {
    super(partCode);
    this.demensions = (parentInfo) => {
      console.log('hinge dem!!');
      return {x:1,y:1,z:1}
    }
  }
}

class Hinges extends Assembly {
  constructor() {
    super();
    const instance = this;
    let hingeCount = 2;

    function setHinges() {
      instance.hardware = Array.fill(hingeCount, () => new Hinge('h'));
      instance.hardware.forEach(h => h.parentAssembly(instance));
    }

    this.demensions = (parentInfo) => {
      const doorHeight = parentInfo.demensions.y;
      hingeCount = doorHeight > 42 * 2.54 ? 3 : 2;
      setHinges();
    }
    this.composite = () => true;
    setHinges();
  }
}

module.exports = Hinges;
