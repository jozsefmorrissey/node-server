
const approximate = require('../../../../../public/js/utils/approximate.js');
const Line2D = require('line');

class Vertex2D extends Lookup {
  constructor(point) {
    if (point instanceof Vertex2D) return point;
    point = point || {x:0,y:0};
    super();
    Object.getSet(this, {point});
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
      vertex = (vertex instanceof Vertex2D) ? vertex : Vertex2D.instance(vertex);
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
      return Vertex2D.instance(copy);
    }

    this.point(point);
  }
}

Vertex2D.instance = (point, group) => {
  if (point instanceof Vertex2D) {
    point.lookupGroup(group);
    return point;
  }
  const inst = Lookup.instance(Vertex2D.name);
  inst.lookupGroup(group);
  inst.point(point);
  return inst;
}

Vertex2D.fromJson = (json) => {
  point = json.point;
  vertex.id(json.id);
  return Vertex2D.instance(point);
}

Vertex2D.center = (...verticies) => {
  let x = 0;
  let y = 0;
  let count = 0;
  verticies.forEach((vertex) => {
      count++;
      x += vertex.x();
      y += vertex.y();
  });
  return Vertex2D.instance({x: x/count, y: y/count});
}

Vertex2D.reusable = true;
new Vertex2D();
