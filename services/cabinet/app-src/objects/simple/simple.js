const BiPolygon = require('../../three-d/objects/bi-polygon');


class SimpleModel {
  constructor(obj3D) {
    this.toModel = () => {
      const biPoly = BiPolygon.fromVectorObject(obj3D.width(), obj3D.height(), obj3D.thickness(), obj3D.center());
      return biPoly.toModel();
    }
  }
}


const classes = {};

SimpleModel.register = (cxtr) => {
  if (new cxtr() instanceof SimpleModel) {
    classes[cxtr.name] = cxtr;
  }
}

SimpleModel.list = () => Object.keys(classes);
SimpleModel.get = (cxtrName,obj3D) => {
  const cxtr = classes[cxtrName] || SimpleModel;
  return new cxtr(obj3D);
}

module.exports = SimpleModel;
