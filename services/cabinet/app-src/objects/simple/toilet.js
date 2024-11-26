
const CSG = require('../../../../../public/js/utils/3d-modeling/csg.js');
const SimpleModel = require('./simple');

class Toilet extends SimpleModel {
  constructor(layout) {
    super(layout);
    this.width(18*2.54);
    this.height(28*2.54);
    this.thickness(29*2.54);
    this.color('#FFF')
  }
}

module.exports = Toilet;
