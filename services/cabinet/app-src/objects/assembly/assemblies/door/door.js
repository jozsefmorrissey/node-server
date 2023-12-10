


const HasPull = require('../has-pull.js');
const Handle = require('../hardware/pull.js');

class Door extends HasPull {
  constructor(partCode, partName) {
    super(partCode, partName);

    this.biPolygon = () => this.parentAssembly().getBiPolygon(partCode);
    this.normals = (array) => {
      const norms = this.biPolygon().normals();
      return !array ? norms : [norms.x, norms.y, norms.z];
    }
    this.toModel = () => {
      const biPolygon = this.biPolygon();
      if (biPolygon) {
        return biPolygon.toModel();
      }
      return undefined;
    }

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
