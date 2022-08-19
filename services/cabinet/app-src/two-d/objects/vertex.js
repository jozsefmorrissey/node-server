
const approximate = require('../../../../../public/js/utils/approximate.js');

class Vertex2d {
  constructor(point) {
    if (Array.isArray(point)) point = {x: point[0], y: point[1]};
    if (point instanceof Vertex2d) return point;
    point = point || {x:0,y:0};
    Object.getSet(this, {point});
    this.layer = point.layer;
    const instance = this;
    this.move = (center) => {
      this.point(center);
      return true;
    };
    this.point = (newPoint) => {
      if (newPoint) this.x(newPoint.x);
      if (newPoint) this.y(newPoint.y);
      return point;
    }

    this.equal = (other) => approximate.eq(other.x(), this.x()) && approximate.eq(other.y(), this.y());
    this.x = (val) => {
      if ((typeof val) === 'number') point.x = approximate(val);
      return this.point().x;
    }
    this.y = (val) => {
      if ((typeof val) === 'number') this.point().y = approximate(val);
      return this.point().y;
    }

    const dummyFunc = () => true;
    this.forEach = (func, backward) => {
      let currVert = this;
      let lastVert;
      do {
        lastVert = currVert;
        func(currVert);
        currVert = backward ? currVert.prevVertex() : currVert.nextVertex();
      } while (currVert && currVert !== this);
      return currVert || lastVert;
    }

    this.distance = (vertex) => {
      vertex = (vertex instanceof Vertex2d) ? vertex : new Vertex2d(vertex);
      const xDiff = vertex.x() - this.x();
      const yDiff = vertex.y() - this.y();
      return Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
    }

    this.toString = () => `(${this.x()}, ${this.y()})`;
    const parentToJson = this.toJson;

    this.offset = (x, y) => {
      const copy = this.toJson();
      if (y !== undefined) copy.y += y;
      if (x !== undefined) copy.x += x;
      return new Vertex2d(copy);
    }

    this.point(point);
  }
}

Vertex2d.fromJson = (json) => {
  point = json.point;
  vertex.id(json.id);
  return new Vertex2d(point);
}

Vertex2d.center = (...verticies) => {
  let x = 0;
  let y = 0;
  let count = 0;
  verticies.forEach((vertex) => {
    if (Number.isFinite(vertex.x() + vertex.y())) {
      count++;
      x += vertex.x();
      y += vertex.y();
    }
  });
  return new Vertex2d({x: x/count, y: y/count});
}

Vertex2d.sort = (a, b) =>
    a.x() === b.x() ? (a.y() === b.y() ? 0 : (a.y() > b.y() ? -1 : 1)) : (a.x() > b.x() ? -1 : 1);

Vertex2d.reusable = true;
new Vertex2d();

module.exports = Vertex2d;
