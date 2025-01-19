const {BiPolygon, Vertex3D} = require('../../../../../public/js/utils/canvas/three-d/lib.js');
const SimpleModel = require('./simple');

class ShowerBase extends SimpleModel {
  constructor(layout, group) {
    super(layout, group);
    this.color('#9e9c8a')
  }
}

module.exports = ShowerBase;
