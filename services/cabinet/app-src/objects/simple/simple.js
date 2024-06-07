const BiPolygon = require('../../three-d/objects/bi-polygon');
const Object3D = require('../../three-d/layout/object.js');

class SimpleModel extends Object3D {
  constructor(layout) {
    super(layout);
    this.length = this.height;
  }
}


const classes = {};

SimpleModel.register = (cxtr) => {
  if (new cxtr() instanceof SimpleModel) {
    classes[cxtr.name] = cxtr;
  }
}

SimpleModel.list = () => Object.keys(classes);
SimpleModel.get = (cxtrName, layout) => {
  const cxtr = classes[cxtrName] || SimpleModel;
  return new cxtr(layout);
}

module.exports = SimpleModel;
