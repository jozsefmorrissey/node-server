const BiPolygon = require('../../three-d/objects/bi-polygon');
const Vertex3D = require('../../three-d/objects/vertex');
const SimpleModel = require('./simple');

class ShowerBase extends SimpleModel {
  constructor(obj3D) {
    super(obj3D);
  }
}

module.exports = ShowerBase;
