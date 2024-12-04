const BiPolygon = require('../../three-d/objects/bi-polygon');
const Vertex3D = require('../../three-d/objects/vertex');
const SimpleModel = require('./simple');

class ShowerBase extends SimpleModel {
  constructor(layout) {
    super(layout);
    this.color('#9e9c8a')
  }
}

module.exports = ShowerBase;
