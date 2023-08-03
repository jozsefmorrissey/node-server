const SnapPolygon = require('./polygon');
const Polygon2d = require('../polygon');

const offset = (parent, attr, magnitude, props) => {
  let val = parent[attr]() * magnitude;
  return val;
};

function vertex(parent, xMagnitude, yMagnitude) {
  const xDiff = offset(parent, 'width', xMagnitude);
  const yDiff = offset(parent, 'height', yMagnitude);
  const vertex = parent.center().clone();
  const direction = xDiff >= 0 ? 1 : -1;
  const hypeLen = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
  let rads = Math.atan(yDiff/xDiff);
  vertex.point({
    x: vertex.x() + direction * (hypeLen * Math.cos(rads)),
    y: vertex.y() + direction * (hypeLen * Math.sin(rads))
  });
  return vertex;
}

class SnapSquare extends SnapPolygon {
  constructor(parent, tolerance) {
    const polygon = new Polygon2d();

    function build() {
      const built = new Polygon2d();
      const vertices = [
        vertex(parent, -.5, .5), //frontLeft
        vertex(parent, .5, .5), //frontRight
        vertex(parent, .5, -.5), //backRight
        vertex(parent, -.5, -.5) //backLeft
      ];
      built.addVertices(vertices.reverse());
      polygon.copy(built);

    }
    build();
    super(parent, polygon, tolerance);
    if (parent === undefined) return this;

    this.object = () => {
      build();
      polygon.center(this.center());
      const rotated = polygon.rotate(parent.radians(), null, true);
      return rotated;
    }
  }
}

module.exports = SnapSquare;
