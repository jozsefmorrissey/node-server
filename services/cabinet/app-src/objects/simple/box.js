
const CSG = require('../../../../../public/js/utils/3d-modeling/csg.js');
const SimpleModel = require('./simple');

class Box extends SimpleModel {
  constructor(layout) {
    super(layout);
    this.width(24*2.54);
    this.height(24*2.54);
    this.thickness(24*2.54);
  }
}

module.exports = Box;
