


const HasPull = require('../has-pull.js');
const Handle = require('../hardware/pull.js');
const Joint = require('../../../joint/joint.js');

class DrawerFront extends HasPull {
  constructor(partCode, partName) {
    super(partCode, partName);
    const instance = this;
    this.addPull(Handle.location.CENTER);

    this.inElivation = true;

    this.front = () => {
      const biPoly = this.biPolygon();
      if (biPoly === undefined) return;
      return biPoly.front();
    }
    this.back = () => {
      const biPoly = this.biPolygon();
      if (biPoly === undefined) return;
      return biPoly.back();
    }
  }
}

DrawerFront.abbriviation = 'df';


module.exports = DrawerFront
