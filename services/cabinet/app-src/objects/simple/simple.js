const {BiPolygon} = require('../../../../../public/js/utils/canvas/three-d/lib.js');
const Object3D = require('../../three-d/layout/object.js');

class SimpleModel extends Object3D {
  constructor(layout, group) {
    super(layout, group);
    this.length = this.height;
    this.groupIndex = () => {
      const gIndex = group.objects.equalIndexOf(this);
      if (gIndex === -1) return 1;
      return gIndex + 1;
    }
    let _name;
    this.name = (name) => !name ? _name || this.constructor.name.toSentance() :
                        (_name = name)

    let _color = 'black';
    this.color = (color) => color !== undefined ? (_color = color) : _color;
  }
}


const classes = {};

SimpleModel.register = (cxtr) => {
  if (new cxtr() instanceof SimpleModel) {
    classes[cxtr.name] = cxtr;
  }
}

SimpleModel.list = () => Object.keys(classes);
SimpleModel.get = (cxtrName, layout, group) => {
  const cxtr = classes[cxtrName] || SimpleModel;
  return new cxtr(layout, group);
}

module.exports = SimpleModel;
