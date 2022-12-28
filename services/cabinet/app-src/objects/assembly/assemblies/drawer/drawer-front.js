


const HasPull = require('../has-pull.js');
const Handle = require('../hardware/pull.js');

class DrawerFront extends HasPull {
  constructor(partCode, partName, getBiPolygon) {
    super(partCode, partName, getBiPolygon);
    const instance = this;
    this.addPull(Handle.location.CENTER);
    this.inElivation = true;

    this.toModel = () => {
      const biPolygon = getBiPolygon();
      if (biPolygon) return biPolygon.toModel();
      return undefined;
    }

    this.front = () => {
      const biPoly = getBiPolygon();
      if (biPoly === undefined) return;
      return biPoly.front();
    }
    this.back = () => {
      const biPoly = getBiPolygon();
      if (biPoly === undefined) return;
      return biPoly.back();
    }
  }
}

DrawerFront.abbriviation = 'df';


module.exports = DrawerFront
