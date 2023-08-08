const BiPolygon = require('../../three-d/objects/bi-polygon');
const Vertex3D = require('../../three-d/objects/vertex');
const SimpleModel = require('./simple');

class ShowerBase extends SimpleModel {
  constructor(obj3D) {
    super(obj3D);
    this.toModel = () => {
      const curbHeight = 2*2.54;
      const curbWidth = 3*2.54;
      const objCenter = obj3D.center();
      const height = obj3D.height();
      const depth = obj3D.thickness();
      const base = BiPolygon.fromVectorObject(obj3D.width(), height-curbHeight, depth, objCenter);
      const curbCenter = new Vertex3D({
        x: objCenter.x,
        y: objCenter.y + height/2,
        z: objCenter.z + depth/2 - curbWidth/2
      });
      const curb = BiPolygon.fromVectorObject(obj3D.width(), curbHeight, curbWidth, curbCenter);
      return base.toModel().union(curb.toModel());
    }
  }
}

module.exports = ShowerBase;
