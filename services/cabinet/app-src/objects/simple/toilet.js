
const CSG = require('../../../../../public/js/utils/3d-modeling/csg.js');
const SimpleModel = require('./simple');

class Toilet extends SimpleModel {
  constructor(obj3D) {
    super(obj3D);
    if (obj3D) {
      obj3D.width(18*2.54);
      obj3D.height(28*2.54);
      obj3D.thickness(29*2.54);
    }
  }
}

module.exports = Toilet;
