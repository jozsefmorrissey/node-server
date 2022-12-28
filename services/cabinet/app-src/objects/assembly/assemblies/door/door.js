


const HasPull = require('../has-pull.js');
const Handle = require('../hardware/pull.js');

class Door extends HasPull {
  constructor(partCode, partName, getBiPolygon) {
    super(partCode, partName, getBiPolygon);

    this.toModel = () => {
      const biPolygon = getBiPolygon();
      if (biPolygon) return biPolygon.toModel();
      return undefined;
    }

    this.inElivation = true;

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

    this.addPull(Handle.location.TOP_RIGHT);
    // this.setPulls([Handle.location.TOP_RIGHT,
    // Handle.location.TOP_LEFT,
    // Handle.location.BOTTOM_RIGHT,
    // Handle.location.BOTTOM_LEFT,
    // Handle.location.TOP,
    // Handle.location.BOTTOM,
    // Handle.location.CENTER,
    // Handle.location.RIGHT,
    // Handle.location.LEFT]);
  }
}

Door.abbriviation = 'dr';


module.exports = Door
