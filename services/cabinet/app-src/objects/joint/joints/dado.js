
const Joint = require('../joint.js');

class Dado extends Joint {
  constructor(malePartCode, femalePartCode, condition) {
    super(malePartCode, femalePartCode, condition);

    this.updatePosition = (position) => {
      if (this.maleOffset() === 0) return;
      const direction = this.centerAxis()[0] === '-' ? -1 : 1;
      const centerAxis = this.centerAxis()[1].toLowerCase();
      const offset = this.parentAssembly().eval(this.maleOffset());
      const demAxis = this.demensionAxis().toLowerCase();
      position.demension[demAxis] = position.demension[demAxis] + offset;
      position.center[centerAxis] = position.center[centerAxis] + (offset/2 * direction);
    };

  }
}

Joint.register(Dado);
module.exports = Dado
