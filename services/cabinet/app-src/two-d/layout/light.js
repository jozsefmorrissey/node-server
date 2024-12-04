
const Vertex3D = require('../../three-d/objects/vertex.js');
const Polygon3D = require('../../three-d/objects/polygon.js');

class Ceiling {
  constructor(layout) {
    let _color = 'yellow';
    let _light;//Light3D....
    this.color = (color) => color !== undefined ? (_color = color) : _color;
    this.light = (light) => light !== undefined ? (_light = light) : _light;

    this.csg = () => {
      props = {start: [0,0,0], end: [0,-1,0], slices: 36};
      props.radius = light.radius();
      const fixture = new CSG.cylinder(props);
      fixture.center(light.center());
      fixture.setColor(light.color());
      return fixture;
    }
  }
}

Object.class.register(Ceiling, 'color');

module.exports = Ceiling;
