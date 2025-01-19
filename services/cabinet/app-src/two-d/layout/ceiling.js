
const {Polygon3D, Vertex3D} = require('../../../../../public/js/utils/canvas/three-d/lib.js');

class Ceiling {
  constructor(layout) {
    let _color = "#f1f1f1";
    this.color = (color) => color !== undefined ? (_color = color) : _color;

    this.csg = () => {
      const walls = layout.walls();
      const height = walls[0].height();
      const verts = walls.map(w => [w[0], w[1]]).concatElements().unique()
                        .map(c => new Vertex3D(c.x, height, c.y));
      const csg = new Polygon3D(verts).csg();
      csg.setColor(this.color(), true);
      return csg;
    }
  }
}

Object.class.register(Ceiling, 'color');

module.exports = Ceiling;
