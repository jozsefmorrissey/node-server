
const approximate10 = require('../../../../../public/js/utils/approximate.js').new(10);
const ToleranceMap = require('../../../../../public/js/utils/tolerance-map.js');
const Tolerance = require('../../../../../public/js/utils/tolerance.js');
const tol = .01;
const within = Tolerance.within(tol);


class Vertex2d {
  constructor(point) {
    if (arguments.length === 2) point = {x:arguments[0], y: arguments[1]};
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

    this.equal = (other) => within(other.x(), this.x()) && within(other.y(), this.y());
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

Vertex2d.minMax = (...vertices) => {
  if (Array.isArray(vertices[0])) vertices = vertices[0];
  const max = new Vertex2d(Number.MIN_SAFE_INTEGER,Number.MIN_SAFE_INTEGER);
  const min = new Vertex2d(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  for (let index = 0; index < vertices.length; index += 1) {
    const vert = vertices[index];
    if (max.x() < vert.x()) max.x(vert.x());
    if (max.y() < vert.y()) max.y(vert.y());
    if (min.x() > vert.x()) min.x(vert.x());
    if (min.y() > vert.y()) min.y(vert.y());
  }
  return {min, max, diff: new Vertex2d(max.x() - min.x(), max.y() - min.y())};
}

Vertex2d.center = (...vertices) => {
  if (Array.isArray(vertices[0])) vertices = vertices[0];
  const minMax = Vertex2d.minMax(...vertices);
  const centerX = minMax.min.x() + (minMax.max.x() - minMax.min.x())/2;
  const centerY = minMax.min.y() + (minMax.max.y() - minMax.min.y())/2;
  return new Vertex2d(centerX, centerY);
}

Vertex2d.weightedCenter = (...vertices) => {
  if (Array.isArray(vertices[0])) vertices = vertices[0];
  let x = 0;
  let y = 0;
  let count = 0;
  vertices.forEach((vertex) => {
    if (Number.isFinite(vertex.x() + vertex.y())) {
      count++;
      x += vertex.x();
      y += vertex.y();
    }
  });
  return new Vertex2d({x: x/count, y: y/count});
}

// Vertex2d.center = Vertex2d.weightedCenter;

Vertex2d.sort = (a, b) =>
    a.x() === b.x() ? (a.y() === b.y() ? 0 : (a.y() > b.y() ? -1 : 1)) : (a.x() > b.x() ? -1 : 1);

const ignoreVerySmall = (v) => Math.abs(v) < .000001 ? 0 : v;
Vertex2d.sortByMax = (verts) => {
  let max;
  const center = Vertex2d.center(verts);
  for (let index = 0; index < verts.length; index++) {
    let v = verts[index];
    let curr = {v, distance: v.distance(center)};
    if (max === undefined || max.distance < curr.distance) {
      max = curr;
    }
  }
  return verts.sort((v1, v2) => {
    const d1 = v1.distance(max.v);
    const d2 = v2.distance(max.v);
    return d2 - d1;
  });
}

Vertex2d.centerOn = (newCenter, vertices) => {
  newCenter = new Vertex2d(newCenter);
  const center = Vertex2d.center(...vertices);
  const diff = newCenter.copy().differance(center);
  for (let index = 0; index < polys.length; index++) {
    const vert = vertices[index];
    vert.translate(diff.x(), diff.y());
  }
}

Vertex2d.toleranceMap = (tolerance, vertices) => {
  tolerance ||= tol;
  vertices = [];
  const map = new ToleranceMap({x: tolerance, y: tolerance});
  for (let index = 0; index < vertices.length; index++) {
    map.add(vertices[index]);
  }
  return map;
}

Vertex2d.reusable = true;
new Vertex2d();

module.exports = Vertex2d;
