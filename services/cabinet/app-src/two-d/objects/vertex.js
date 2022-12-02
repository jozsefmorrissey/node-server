
const approximate = require('../../../../../public/js/utils/approximate.js').new(1000000);
const approximate10 = require('../../../../../public/js/utils/approximate.js').new(10);


class Vertex2d {
  constructor(point) {
    if (Array.isArray(point)) point = {x: point[0], y: point[1]};
    if (point instanceof Vertex2d) return point;
    let modificationFunction;
    point = point || {x:0,y:0};
    Object.getSet(this, {point});
    this.layer = point.layer;
    const instance = this;
    this.move = (center) => {
      this.point(center);
      return true;
    };

    this.translate = (xOffset, yOffset) => {
      this.point().x += xOffset;
      this.point().y += yOffset;
    }
    this.point = (newPoint) => {
      newPoint = newPoint instanceof Vertex2d ? newPoint.point() : newPoint;
      if (newPoint) this.x(newPoint.x);
      if (newPoint) this.y(newPoint.y);
      return point;
    }

    this.modificationFunction = (func) => {
      if ((typeof func) === 'function') {
        if ((typeof this.id) !== 'function') Lookup.convert(this);
        modificationFunction = func;
      }
      return modificationFunction;
    }

    this.equal = (other) => approximate.eq(other.x(), this.x()) && approximate.eq(other.y(), this.y());
    this.x = (val) => {
      if ((typeof val) === 'number') point.x = val;
      return this.point().x;
    }
    this.y = (val) => {
      if ((typeof val) === 'number') this.point().y = val;
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
    this.approxToString = () => `(${approximate10(this.x())}, ${approximate10(this.y())})`;
    const parentToJson = this.toJson;

    this.offset = (x, y) => {
      if (x instanceof Vertex2d) {
        y = x.y();
        x = x.x();
      }
      const copy = this.toJson().point;
      if (y !== undefined) copy.y += y;
      if (x !== undefined) copy.x += x;
      return new Vertex2d(copy);
    }

    this.copy = () => new Vertex2d([this.x(), this.y()]);

    this.differance = (x, y) => {
      if (x instanceof Vertex2d) {
        y = x.y();
        x = x.x();
      }
      return new Vertex2d({x: this.x() - x, y: this.y() - y});
    }

    this.point(point);
  }
}

Vertex2d.fromJson = (json) => {
  return new Vertex2d(json.point);
}

Vertex2d.center = (...verticies) => {
  if (Array.isArray(verticies[0])) verticies = verticies[0];
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

Vertex2d.sortByCenter = (center) => {
  return (v1, v2) => {
    const d1 = v1.distance(center);
    const d2 = v2.distance(center);
    return d2 - d1;
  }
}


Vertex2d.reusable = true;
new Vertex2d();

module.exports = Vertex2d;
