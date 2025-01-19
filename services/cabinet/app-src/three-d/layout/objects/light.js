
const Object3D = require('../object');
const Vector3D = require('../../../../../../public/js/utils/canvas/three-d/objects/vector.js');

class Light3D extends Object3D {
  constructor(layout, radius, center) {
    super(layout);
    let _color = '#FAFFEB';
    const normal = new Vector3D(0,-1,0);
    this.center(center);
    this.radius = (rad) => rad === undefined ? radius : (radius = rad);
    this.color = (color) => color === undefined ? _color : (_color - color);
    this.normal = () => normal.rotate(this.rotation());
  }
}

module.exports = Light3D;
