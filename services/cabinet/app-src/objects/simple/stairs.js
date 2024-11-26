
const CSG = require('../../../../../public/js/utils/3d-modeling/csg.js');
const SimpleModel = require('./simple');

class Stairs extends SimpleModel {
  constructor(layout) {
    super(layout);
    Object.getSet(this, {count: 2, treadLength: 10*2.54});
    this.width(37*2.54);
    this.height(20*2.54);
    this.color('#537D97');
    this.thickness = () => this.treadLength() * this.count();
  }
}

module.exports = Stairs;
