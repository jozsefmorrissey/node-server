
const Vertex3D = require('../../three-d/objects/vertex.js');
const Polygon3D = require('../../three-d/objects/polygon.js');

class Floor {
  constructor(layout) {
    let _color = '#9aacb6';
    this.color = (color) => color !== undefined ? (_color = color) : _color;

    this.csg = () => {
      const walls = layout.walls();
      const verts = walls.map(w => [w[0], w[1]]).concatElements().unique()
                        .map(c => new Vertex3D(c.x, 0, c.y));
      const csg = new Polygon3D(verts.reverse()).csg();
      csg.setColor(this.color(), true);
      return csg;
    }
  }
}

Object.class.register(Floor, 'color');

module.exports = Floor;
