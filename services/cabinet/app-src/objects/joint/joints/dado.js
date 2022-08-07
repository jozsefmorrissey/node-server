


const Joint = require('../joint.js');

class Dado extends Joint {
  constructor(malePartCode, femalePartCode) {
    super(malePartCode, femalePartCode);

    this.updatePosition = (position) => {
      const direction = this.centerAxis()[0] === '-' ? -1 : 1;
      const centerAxis = this.centerAxis()[1].toLowerCase();
      const offset = this.parentAssembly().eval(this.maleOffset());
      position.demension[this.demensionAxis().toLowerCase()] += offset;
      position.center[centerAxis] += offset/2 * direction;
    };

  }
}

Joint.register(Dado);
module.exports = Dado
