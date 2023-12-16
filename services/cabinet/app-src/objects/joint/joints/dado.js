
const Joint = require('../joint.js');

class Dado extends Joint {
  constructor(maleJointSelector, femaleJointSelector, condition, locationId) {
    super(maleJointSelector, femaleJointSelector, condition, locationId);

    this.updatePosition = (position) => {
      const applied = position.applied && position.applied[this.toString()];
      if (this.maleOffset() === 0 || applied) return;
      const direction = this.centerAxis()[0] === '-' ? -1 : 1;
      const centerAxis = this.centerAxis()[1].toLowerCase();
      const offset = this.parentAssembly().eval(this.maleOffset());
      const demAxis = this.demensionAxis().toLowerCase();
      position.demension[demAxis] = position.demension[demAxis] + offset;
      position.center[centerAxis] = position.center[centerAxis] + (offset/2 * direction);
      position.applied ||= {};
      position.applied[this.toString()] = true;
    };

  }
}

Joint.register(Dado);
module.exports = Dado
