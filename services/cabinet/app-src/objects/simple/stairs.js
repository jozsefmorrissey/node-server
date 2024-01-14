
const CSG = require('../../../../../public/js/utils/3d-modeling/csg.js');
const SimpleModel = require('./simple');

class Stairs extends SimpleModel {
  constructor(obj3D) {
    super();
    Object.getSet(this, {count: 2, treadLength: 10*2.54});
    if (obj3D) {
      obj3D.width(37*2.54);
      obj3D.height(20*2.54);
      obj3D.thickness = () => this.treadLength() * this.count();
    }
  }
}

module.exports = Stairs;
