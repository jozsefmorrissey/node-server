const BiPolygon = require('../../three-d/objects/bi-polygon');
const Vertex3D = require('../../three-d/objects/vertex');
const SimpleModel = require('./simple');

class ShowerBase extends SimpleModel {
  constructor(layout) {
    super(layout);
    this.color('#CFC7A0')
  }
}

module.exports = ShowerBase;
